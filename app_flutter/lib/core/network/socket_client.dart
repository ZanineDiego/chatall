import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketClient {
  late IO.Socket _socket;

  // Inicializa a conexão com o servidor Node.js
  void init({required String baseUrl}) {
    _socket = IO.io(baseUrl, 
      IO.OptionBuilder()
        .setTransports(['websocket']) // Força o uso de WebSockets pura (mais rápido)
        .disableAutoConnect()         // Vamos conectar manualmente
        .build()
    );

    _socket.connect();

    _socket.onConnect((_) => print('🔗 Conectado ao servidor de Sockets!'));
    _socket.onDisconnect((_) => print('❌ Desconectado do servidor.'));
  }

  // ==================== EMISSORES (Ações do Usuário) ====================

  /// Diz ao back-end para colocar o usuário na fila de espera
  void enterQueue({required String userId, required String nickname}) {
    _socket.emit('enter_queue', {
      'userId': userId,
      'nickname': nickname,
    });
  }

  /// Envia uma mensagem de texto para a sala atual
  void sendMessage({required String roomId, required String senderId, required String text}) {
    _socket.emit('send_message', {
      'roomId': roomId,
      'senderId': senderId,
      'text': text,
    });
  }

  /// Abandona o chat atual (Ação do botão "Próximo / Skip")
  void leaveRoom({required String roomId}) {
    _socket.emit('leave_room', {
      'roomId': roomId,
    });
  }

  // ==================== OUVINTES (Respostas do Servidor) ====================

  /// Escuta quando o back-end encontra um parceiro de conversa
  void onMatchFound(Function(Map<String, dynamic> data) onMatch) {
    _socket.on('match_found', (data) => onMatch(data));
  }

  /// Escuta quando novas mensagens chegam do parceiro
  void onNewMessage(Function(Map<String, dynamic> data) onMessage) {
    _socket.on('new_message', (data) => onMessage(data));
  }

  /// Escuta se o parceiro clicou em "Próximo" ou desconectou
  void onPeerLeft(Function() onLeft) {
    _socket.on('peer_left', (_) => onLeft());
  }

  // Desconecta completamente (Útil no logout do app)
  void disconnect() {
    _socket.disconnect();
  }
}