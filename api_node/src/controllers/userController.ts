import { Request, Response } from 'express';
import { prisma } from '../server';

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nickname, gender, age } = req.body;

    // Validações básicas dos dados recebidos
    if (!nickname || !gender || !age) {
      res.status(400).json({ error: 'Todos os campos (nickname, gender, age) são obrigatórios.' });
      return;
    }

    if (typeof age !== 'number' || age < 18) {
      res.status(400).json({ error: 'O usuário deve ser maior de 18 anos.' });
      return;
    }

    // Cria o usuário e o perfil associado em uma única transação do Prisma
    const newUser = await prisma.user.create({
      data: {
        profile: {
          create: {
            nickname,
            gender,
            age,
          },
        },
      },
      include: {
        profile: true, // Já retorna o perfil acoplado
      },
    });

    // Retorna o usuário criado com status 201 (Created)
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ error: 'Erro interno ao salvar o usuário no banco de dados.' });
  }
};