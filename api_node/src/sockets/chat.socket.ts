import { Server, Socket } from 'socket.io';
import redisClient from '../redis';
import { prisma } from '../server';

const FLUSH_INTERVAL = 15 * 60 * 1000;

export function handleChatSockets(io: Server, socket: Socket) {
  
  socket.on('send_message', async (data: { roomId: string; text: string; senderId: string; mediaType: 'text' | 'image' | 'audio' }) => {
    const { roomId, text, senderId, mediaType } = data;

    const isRoomAdmin = await redisClient.get(`admin_spying:${socket.id}:${roomId}`);
    if (isRoomAdmin) return socket.emit('error', { message: 'Modo espião não permite interações.' });

    const messageObj = { senderId, content: text, mediaType, createdAt: new Date().toISOString() };

    socket.to(roomId).emit('new_message', messageObj);
    await redisClient.rPush(`chat_cache:${roomId}`, JSON.stringify(messageObj));

    const isActivated = await redisClient.get(`room_activated:${roomId}`);
    if (!isActivated) {
      const participantsRaw = await redisClient.get(`room_participants:${roomId}`);
      if (participantsRaw) {
        const { user1, user2 } = JSON.parse(participantsRaw);
        
        await prisma.matchHistory.create({
          data: { user1Id: user1.id, user2Id: user2.id, roomId }
        }).catch(err => console.error('Erro de persistência:', err));

        const timerId = setTimeout(() => flushMessagesToPostgres(roomId), FLUSH_INTERVAL);
        await redisClient.set(`room_timer:${roomId}`, String(timerId));
        await redisClient.set(`room_activated:${roomId}`, 'true');
      }
    }

    const user = await prisma.user.findUnique({ where: { id: senderId }, select: { isFlagged: true } });
    if (user?.isFlagged) {
      await prisma.chatMessage.create({
        data: { roomId, senderId, content: text, mediaType }
      }).catch(() => null);
    }
  });

  socket.on('admin_spy_room', async (data: { adminId: string; roomId: string }) => {
    const { adminId, roomId } = data;
    const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { isAdmin: true } });
    if (!admin || !admin.isAdmin) return socket.emit('error', { message: 'Acesso negado.' });

    socket.join(roomId);
    await redisClient.set(`admin_spying:${socket.id}:${roomId}`, 'true');

    const cachedMessages = await redisClient.lRange(`chat_cache:${roomId}`, 0, -1);
    const history = cachedMessages.map(msg => JSON.parse(msg));
    socket.emit('admin_spy_success', { roomId, history });
  });

  socket.on('leave_room', async () => { await handleUserDisconnection(socket, io); });
  socket.on('disconnect', async () => { await handleUserDisconnection(socket, io); });
}

async function flushMessagesToPostgres(roomId: string) {
  const messages = await redisClient.lRange(`chat_cache:${roomId}`, 0, -1);
  if (messages.length === 0) return;

  const parsedMessages = messages.map(m => {
    const item = JSON.parse(m);
    return { roomId, senderId: item.senderId, content: item.content, mediaType: item.mediaType };
  });

  await prisma.chatMessage.createMany({ data: parsedMessages });
  await redisClient.lTrim(`chat_cache:${roomId}`, messages.length, -1);
}

async function handleUserDisconnection(socket: Socket, io: Server) {
  const roomId = await redisClient.get(`active_room:${socket.id}`);
  if (roomId) {
    io.to(roomId).emit('peer_left');

    const isActivated = await redisClient.get(`room_activated:${roomId}`);
    if (isActivated) {
      await flushMessagesToPostgres(roomId);
      const timerId = await redisClient.get(`room_timer:${roomId}`);
      if (timerId) clearTimeout(Number(timerId));
    } else {
      await redisClient.del(`chat_cache:${roomId}`);
      await redisClient.del(`room_participants:${roomId}`);
    }

    await redisClient.del(`active_room:${socket.id}`);
    socket.leave(roomId);
  }

  const keys = await redisClient.keys(`admin_spying:${socket.id}:*`);
  for (const key of keys) await redisClient.del(key);
}