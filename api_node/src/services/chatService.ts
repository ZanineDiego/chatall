import { prisma } from '../config/database';

interface ISaveMessageDTO {
  roomId: string;
  senderId: string;
  recipientId: string;
  content: string;
  mediaType?: string; // Por padrão será 'text' no schema
}

export class ChatService {
  /**
   * Persiste de forma segura e atômica uma mensagem no PostgreSQL vinda da camada em tempo real (Redis)
   */
  async persistChatMessage(payload: ISaveMessageDTO): Promise<void> {
    const { roomId, senderId, recipientId, content, mediaType = 'text' } = payload;

    // Executa as operações em bloco único (Se uma falhar, o banco desfaz tudo)
    await prisma.$transaction(async (tx) => {
      
      // 1. Garante que a linha mestre do Chat (MatchHistory) exista usando o roomId universal do Redis
      await tx.matchHistory.upsert({
        where: { roomId: roomId },
        update: { 
          lastMessageAt: new Date() // Se já existia, atualiza o carimbo de última atividade
        },
        create: {
          roomId: roomId,
          user1Id: senderId,
          user2Id: recipientId,
          lastMessageAt: new Date()
        }
      });

      // 2. Cria o registro físico da mensagem indexada a essa sala estável
      await tx.chatMessage.create({
        data: {
          roomId: roomId,
          senderId: senderId,
          content: content,
          mediaType: mediaType
        }
      });
      
      // 3. Atualiza o medidor de atividade do usuário ativo para adiar o robô dos 90 dias
      await tx.user.update({
        where: { id: senderId },
        data: { lastActiveAt: new Date() }
      });
    });
  }
}