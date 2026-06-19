import { Request, Response } from 'express';
import { prisma } from '../server';

export const getUserHomeChats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    // Busca chats onde o usuário é participante
    const chats = await prisma.matchHistory.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      include: {
        // Traz apenas a última mensagem para o balão da Home
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        // Traz o perfil dos usuários envolvidos (omitindo dados de moderação)
        user1: { select: { id: true, profile: { select: { nickname: true } } } },
        user2: { select: { id: true, profile: { select: { nickname: true } } } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    // Formata a resposta limpando dados desnecessários para o usuário final
    const formattedChats = chats.map(chat => {
      const isUser1 = chat.user1Id === userId;
      const peer = isUser1 ? chat.user2 : chat.user1;
      const lastMsg = chat.messages[0] || null;

      return {
        roomId: chat.roomId,
        peerNickname: peer?.profile?.nickname || 'Usuário Anônimo',
        peerId: peer?.id,
        lastMessage: lastMsg ? lastMsg.content : 'Nenhuma mensagem.',
        lastMessageTime: lastMsg ? lastMsg.createdAt : chat.createdAt,
        mediaType: lastMsg ? lastMsg.mediaType : 'text'
      };
    });

    res.status(200).json(formattedChats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao carregar conversas da Home.' });
  }
};