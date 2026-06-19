import cron from 'node-cron';
import { prisma } from '../config/database';

export function initCleanupJob() {
  // Agenda para rodar todos os dias às 03:00 da manhã (horário de menor uso do app)
  cron.schedule('0 3 * * *', async () => {
    console.log('[CRON WORKER] Iniciando varredura diária de governança de dados...');

    const dataLimite45Dias = new Date();
    dataLimite45Dias.setDate(dataLimite45Dias.getDate() - 45);

    const dataLimite90Dias = new Date();
    dataLimite90Dias.setDate(dataLimite90Dias.getDate() - 90);

    try {
      // REGRA 1: Deleta históricos de conversas e mensagens inativas há mais de 45 dias
      // Condição: O chat não pode estar congelado e nenhum dos dois usuários pode estar flagged
      const chatsLimpos = await prisma.matchHistory.deleteMany({
        where: {
          lastMessageAt: { lt: dataLimite45Dias },
          isFrozen: false,
          user1: { isFlagged: false },
          user2: { isFlagged: false }
        }
      });

      // REGRA 2: Deleta usuários comuns (não-admins) totalmente inativos há mais de 90 dias
      // Condição: O usuário não pode estar marcado/flagged pela moderação
      const usuariosLimpos = await prisma.user.deleteMany({
        where: {
          lastActiveAt: { lt: dataLimite90Dias },
          isFlagged: false,
          isAdmin: false
        }
      });

      console.log(`[CRON WORKER] Sucesso: ${chatsLimpos.count} salas antigas e ${usuariosLimpos.count} contas inativas foram limpas.`);
    } catch (error) {
      console.error('[CRON WORKER] Erro crítico ao executar rotina de limpeza:', error);
    }
  });
}