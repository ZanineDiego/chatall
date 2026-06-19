import { PrismaClient } from '@prisma/client';

const prismaRaw = new PrismaClient();

// Estendendo o cliente do Prisma com regras de segurança customizadas
export const prisma = prismaRaw.$extends({
  query: {
    user: {
      async delete({ args, query }) {
        // 1. Busca se o usuário está marcado pela moderação antes de prosseguir
        const user = await prismaRaw.user.findUnique({
          where: args.where,
          select: { isFlagged: true }
        });

        // 2. Se a flag de segurança for verdadeira, aborta a operação imediatamente
        if (user?.isFlagged) {
          throw new Error(
            "Segurança Crítica: Abortada a tentativa de deleção física de um usuário marcado (isFlagged = true)."
          );
        }

        // 3. Se estiver limpo, executa a deleção normal do banco
        return query(args);
      },
      async deleteMany({ args, query }) {
        // Proteção para deleções em massa (garante que deletes em lote respeitem a flag)
        args.where = {
          ...args.where,
          isFlagged: false
        };
        return query(args);
      }
    },
  },
});