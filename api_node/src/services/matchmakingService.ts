import { redis } from '../redis';
import { v4 as uuidv4 } from 'uuid';

export class MatchmakingService {
  private poolKey = 'discovery:pool';

  async findOrCreateMatch(userId: string): Promise<{ matchFound: boolean; roomId?: string; peerId?: string; isInitiator?: boolean }> {
    const now = Date.now();
    const tenMinutesLater = now + 10 * 60 * 1000;

    // Limpa expirados do pool de 10 minutos
    await redis.zremrangebyscore(this.poolKey, '-inf', now.toString());

    // Procura alguém disponível que não seja o próprio usuário
    const availableUsers = await redis.zrangebyscore(this.poolKey, now.toString(), '+inf');
    const peerId = availableUsers.find(id => id !== userId);

    if (peerId) {
      await redis.zrem(this.poolKey, peerId); // Remove do pool
      
      const roomId = uuidv4();
      const roomKey = `temp:room:${roomId}`;

      // Cria a sala temporária (não ativada)
      await redis.hset(roomKey, { user1: userId, user2: peerId, isActivated: 'false' });
      await redis.expire(roomKey, 3600); 

      return { matchFound: true, roomId, peerId, isInitiator: true };
    }

    // Se a fila estiver vazia, entra no pool por 10 minutos
    await redis.zadd(this.poolKey, tenMinutesLater.toString(), userId);
    return { matchFound: false };
  }

  async skipMatch(roomId: string): Promise<void> {
    const roomKey = `temp:room:${roomId}`;
    const isActivated = await redis.hget(roomKey, 'isActivated');
    
    // Se foi pulado sem mensagens, descarta permanentemente do Redis
    if (isActivated === 'false') {
      await redis.del(roomKey);
      await redis.del(`messages:queue:${roomId}`);
    }
  }
}