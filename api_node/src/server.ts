import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setupSockets } from './sockets';
import { initCleanupJob } from './jobs/cleanupJob';
import userRoutes from './routes/userRoutes'; 
import './redis';

// Importamos e re-exportamos o prisma estendido e seguro do arquivo de configuração.
// Isso evita duplicar instâncias e garante que todo o app use as travas de segurança.
export { prisma } from './config/database';

const app = express();
const httpServer = createServer(app);

// Middlewares Globais (Apenas uma declaração limpa)
app.use(express.json());

// Configuração do servidor Socket.io acoplado ao servidor HTTP
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
});

// ==========================================
// INICIALIZAÇÃO DE ROTINAS EM SEGUNDO PLANO
// ==========================================
// Ativa o robô de governança de dados (limpeza automática de 45 e 90 dias)
initCleanupJob();

// ==========================================
// ROTAS DA API EXPRESS
// ==========================================
// Injeta as rotas de usuário (todas as rotas começam com /api)
app.use('/api', userRoutes); 

// Rota de verificação de integridade (Health Check)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'Back-end do Chat rodando e integrado ao banco de dados!' 
  });
});

// Inicializa os ouvintes de eventos do Socket.io
setupSockets(io);

const PORT = process.env.PORT || 3000;

// Inicializa o servidor unificado (HTTP + WebSockets) na mesma porta
httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor voando baixo na porta ${PORT}`);
});