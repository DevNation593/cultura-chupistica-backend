const { Server } = require('socket.io');

/**
 * Configura y inicializa el servidor Socket.IO
 */
class SocketServer {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupEventHandlers();
  }

  /**
   * Configura los event handlers principales
   */
  setupEventHandlers() {
    // Eventos de servidor
    this.io.on('error', (error) => {
      console.error('Socket.IO Server Error:', error);
    });

    console.log('Socket.IO Server configurado correctamente');
  }

  /**
   * Obtiene la instancia de Socket.IO
   * @returns {Server} instancia de Socket.IO
   */
  getIO() {
    return this.io;
  }

  /**
   * Obtiene información sobre las conexiones activas
   * @returns {Object} información de conexiones
   */
  getConnectionsInfo() {
    return {
      connectedClients: this.io.sockets.sockets.size,
      rooms: this.gameSocketHandler.getRoomsInfo(),
      timestamp: new Date()
    };
  }

  /**
   * Envía un mensaje a todos los clientes
   * @param {string} event nombre del evento
   * @param {Object} data datos del evento
   */
  broadcast(event, data) {
    this.io.emit(event, data);
  }

  /**
   * Envía un mensaje a una sala específica
   * @param {string} room nombre de la sala
   * @param {string} event nombre del evento
   * @param {Object} data datos del evento
   */
  broadcastToRoom(room, event, data) {
    this.io.to(room).emit(event, data);
  }

  /**
   * Cierra el servidor Socket.IO
   */
  close() {
    this.io.close();
    console.log('Socket.IO Server cerrado');
  }
}

module.exports = SocketServer;
