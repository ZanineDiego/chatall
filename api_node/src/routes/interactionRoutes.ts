import { Router } from 'express';
import { 
  adminGetChatAuditory, 
  getUserHomeChats 
} from '../controllers/interactionController';

const router = Router();

/**
 * ==========================================
 * ROTAS DO USUÁRIO COMUM
 * ==========================================
 */

// Retorna as conversas ativas da Home (de 20 em 20) com o último balão de mensagem e hora
router.get('/users/:userId/chats', getUserHomeChats);


/**
 * ==========================================
 * ROTAS ADMINISTRATIVAS / MODERAÇÃO
 * (Invisíveis para o usuário comum no app)
 * ==========================================
 */

// Rota de Auditoria: Permite ao moderador ler o espelho estático do chat e dados dos envolvidos
router.get('/admin/:adminId/chats/:roomId', adminGetChatAuditory);

export default router;