import { Request, Response } from 'express';
import { prisma } from '../server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_super_segura';

// Token de longa duração (99 anos) para mantê-lo logado permanentemente no celular
const generatePersistentToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '36135d' }); 
};

// 1. LOGIN COM GOOGLE
export const loginWithGoogle = async (req: Request, res: Response): Promise<any> => {
  try {
    const { googleId, email } = req.body;
    if (!googleId) return res.status(400).json({ error: 'Google ID é obrigatório.' });

    let user = await prisma.user.findUnique({ where: { googleId }, include: { profile: true } });

    if (!user) {
      user = await prisma.user.create({
        data: { googleId, email },
        include: { profile: true }
      });
    }

    const token = generatePersistentToken(user.id);
    return res.json({ token, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro na autenticação com o Google.' });
  }
};

// 2. LOGIN COM APPLE
export const loginWithApple = async (req: Request, res: Response): Promise<any> => {
  try {
    const { appleId, email } = req.body;
    if (!appleId) return res.status(400).json({ error: 'Apple ID é obrigatório.' });

    let user = await prisma.user.findUnique({ where: { appleId }, include: { profile: true } });

    if (!user) {
      user = await prisma.user.create({
        data: { appleId, email },
        include: { profile: true }
      });
    }

    const token = generatePersistentToken(user.id);
    return res.json({ token, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro na autenticação com a Apple.' });
  }
};

// 3. LOGIN COM TELEFONE (SMS)
export const loginWithPhone = async (req: Request, res: Response): Promise<any> => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Número de telefone é obrigatório.' });

    let user = await prisma.user.findUnique({ where: { phone }, include: { profile: true } });

    if (!user) {
      user = await prisma.user.create({
        data: { phone },
        include: { profile: true }
      });
    }

    const token = generatePersistentToken(user.id);
    return res.json({ token, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro na autenticação por telefone.' });
  }
};