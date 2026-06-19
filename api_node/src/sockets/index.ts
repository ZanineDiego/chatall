import { Server, Socket } from 'socket.io';
import { handleMatchSockets } from './match.socket';
import { handleChatSockets } from './chat.socket';

export const setupSockets = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    // Ativa os módulos passando as conexões
    handleMatchSockets(io, socket);
    handleChatSockets(io, socket);
  });
};