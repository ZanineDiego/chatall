import { Server, Socket } from 'socket.io';
import redisClient from '../redis';
import { prisma } from '../server';
import { v4 as uuidv4 } from 'uuid';

interface DiscoveryData {
  userId: string;
  nickname: string;
  myGender: string;
  myAge: number;
  searchingForGender: string;
  minAge: number;
  maxAge: number;
  socketId: string;
}

export function handleMatchSockets(io: Server, socket: Socket) {
  socket.on('discover_peer', async (data: Omit<DiscoveryData, 'socketId'>) => {
    const { userId, nickname, myGender, myAge, searchingForGender, minAge, maxAge } = data;
    if (!userId) return;

    await prisma.user.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() }
    }).catch(() => null);

    const poolKeys = await redisClient.keys('pool_user:*');
    let peerFound: DiscoveryData | null = null;

    for (const key of poolKeys) {
      const peerId = key.split(':')[1];
      if (peerId !== userId) {
        const peerRaw = await redisClient.get(key);
        if (peerRaw) {
          const peer: DiscoveryData = JSON.parse(peerRaw);

          const genderMatchMeToPeer = searchingForGender === 'all' || searchingForGender === peer.myGender;
          const ageMatchMeToPeer = peer.myAge >= minAge && peer.myAge <= maxAge;
          const genderMatchPeerToMe = peer.searchingForGender === 'all' || peer.searchingForGender === myGender;
          const ageMatchPeerToMe = myAge >= peer.minAge && myAge <= peer.maxAge;

          if (genderMatchMeToPeer && ageMatchMeToPeer && genderMatchPeerToMe && ageMatchPeerToMe) {
            peerFound = peer;
            await redisClient.del(key);
            break;
          }
        }
      }
    }

    if (peerFound) {
      const roomId = uuidv4();
      socket.join(roomId);

      const peerSocket = io.sockets.sockets.get(peerFound.socketId);
      if (peerSocket) peerSocket.join(roomId);

      await redisClient.set(`active_room:${socket.id}`, roomId);
      if (peerSocket) await redisClient.set(`active_room:${peerFound.socketId}`, roomId);

      await redisClient.set(`room_participants:${roomId}`, JSON.stringify({
        user1: { id: userId, nickname },
        user2: { id: peerFound.userId, nickname: peerFound.nickname }
      }));

      socket.emit('peer_discovered', { roomId, peer: { userId: peerFound.userId, nickname: peerFound.nickname } });
      if (peerSocket) {
        peerSocket.emit('peer_discovered', { roomId, peer: { userId, nickname } });
      }
    } else {
      const myData: DiscoveryData = { userId, nickname, myGender, myAge, searchingForGender, minAge, maxAge, socketId: socket.id };
      await redisClient.setEx(`pool_user:${userId}`, 600, JSON.stringify(myData));
      socket.emit('waiting_in_pool', { message: 'Buscando pessoas compatíveis no pool...' });
    }
  });
}