import cron from 'node-cron';
import { prisma } from '../server';

export const initCleanupJob = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('🧹 Iniciando rotina diária de limpeza...');
    const hoje = new Date();
    const limiteHistorico = new Date(hoje.getTime() - (45 * 24 * 60 * 60 * 1000));
    const limiteConta = new Date(hoje.getTime() - (90 * 24 * 60 * 60 * 1000));

    try {
      // 1. Apagar chats com mais de 45 dias (EXCETO se estiver congelado ou usuário marcado)
      const historicosApagados = await prisma.matchHistory.deleteMany({
        where: {
          createdAt: { lt: limiteHistorico },
          isFrozen: false, // Não apaga se estiver congelado para provas
          user1: { isFlagged: false }, // Não apaga se o user1 for suspeito
          user2: { isFlagged: false }  // Não apaga se o user2 for suspeito
        }
      });
      if (historicosApagados.count > 0) {
        console.log(`📉 Históricos antigos limpos: ${historicosApagados.count}`);
      }

      // 2. Apagar contas inativas há mais de 90 dias (EXCETO se for admin ou flagged)
      const contasDeletadas = await prisma.user.deleteMany({
        where: {
          lastActiveAt: { lt: limiteConta },
          isFlagged: false, // Mantém a conta se estiver sob investigação
          isAdmin: false    // Não apaga administradores
        }
      });
      if (contasDeletadas.count > 0) {
        console.log(`❌ Contas inativas removidas: ${contasDeletadas.count}`);
      }
    } catch (error) {
      console.error('❌ Erro na limpeza:', error);
    }
  });
};