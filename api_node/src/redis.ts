import { createClient } from 'redis';

// Cria o cliente utilizando a URL definida no arquivo .env (se não houver, tenta o localhost)
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({
  url: redisUrl,
});

redisClient.on('error', (err) => console.error('❌ Erro no cliente do Redis:', err));
redisClient.on('connect', () => console.log('💾 Conectado ao banco Redis com sucesso!'));

// Inicializa a conexão de forma assíncrona
(async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
})();

export default redisClient;