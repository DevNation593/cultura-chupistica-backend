const GameEventService = require('./GameEventService');

/**
 * Servicio de dominio para notificaciones en tiempo real
 */
class GameNotificationService {
  /**
   * Tipos de notificaciones
   */
  static get NOTIFICATION_TYPES() {
    return {
      INFO: 'info',
      SUCCESS: 'success',
      WARNING: 'warning',
      ERROR: 'error',
      GAME_UPDATE: 'game_update',
      PLAYER_ACTION: 'player_action',
      RULE_TRIGGER: 'rule_trigger',
      SYSTEM: 'system'
    };
  }

  /**
   * Prioridades de notificación
   */
  static get NOTIFICATION_PRIORITIES() {
    return {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };
  }

  /**
   * Crea una notificación
   * @param {string} type - Tipo de notificación
   * @param {string} message - Mensaje de la notificación
   * @param {string} gameCode - Código de la partida
   * @param {string} playerId - ID del jugador (opcional)
   * @param {Object} data - Datos adicionales
   * @param {string} priority - Prioridad de la notificación
   * @returns {Object} Notificación creada
   */
  static createNotification(type, message, gameCode, playerId = null, data = {}, priority = this.NOTIFICATION_PRIORITIES.MEDIUM) {
    const notification = {
      id: this.generateNotificationId(),
      type,
      message,
      gameCode,
      playerId,
      data: { ...data },
      priority,
      timestamp: new Date(),
      read: false,
      persistent: false
    };

    return notification;
  }

  /**
   * Genera un ID único para una notificación
   * @returns {string} ID único
   */
  static generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Crea notificación de partida creada
   * @param {string} gameCode - Código de la partida
   * @param {string} hostId - ID del host
   * @returns {Object} Notificación
   */
  static createGameCreatedNotification(gameCode, hostId) {
    return this.createNotification(
      this.NOTIFICATION_TYPES.SUCCESS,
      `Partida ${gameCode} creada exitosamente`,
      gameCode,
      hostId,
      { action: 'game_created' },
      this.NOTIFICATION_PRIORITIES.HIGH
    );
  }

  /**
   * Crea notificación de jugador unido
   * @param {string} gameCode - Código de la partida
   * @param {string} playerId - ID del jugador
   * @param {number} playerCount - Número total de jugadores
   * @returns {Object} Notificación
   */
  static createPlayerJoinedNotification(gameCode, playerId, playerCount) {
    return this.createNotification(
      this.NOTIFICATION_TYPES.INFO,
      `${playerId} se unió a la partida (${playerCount} jugadores)`,
      gameCode,
      null,
      { 
        action: 'player_joined',
        newPlayer: playerId,
        playerCount 
      },
      this.NOTIFICATION_PRIORITIES.MEDIUM
    );
  }

  /**
   * Crea notificación de jugador que se fue
   * @param {string} gameCode - Código de la partida
   * @param {string} playerId - ID del jugador
   * @param {number} playerCount - Número total de jugadores restantes
   * @returns {Object} Notificación
   */
  static createPlayerLeftNotification(gameCode, playerId, playerCount) {
    return this.createNotification(
      this.NOTIFICATION_TYPES.WARNING,
      `${playerId} abandonó la partida (${playerCount} jugadores)`,
      gameCode,
      null,
      { 
        action: 'player_left',
        leftPlayer: playerId,
        playerCount 
      },
      this.NOTIFICATION_PRIORITIES.MEDIUM
    );
  }

  /**
   * Crea notificación de partida iniciada
   * @param {string} gameCode - Código de la partida
   * @param {Array<string>} players - Lista de jugadores
   * @returns {Object} Notificación
   */
  static createGameStartedNotification(gameCode, players) {
    return this.createNotification(
      this.NOTIFICATION_TYPES.SUCCESS,
      `¡La partida ${gameCode} ha comenzado!`,
      gameCode,
      null,
      { 
        action: 'game_started',
        players: [...players],
        playerCount: players.length
      },
      this.NOTIFICATION_PRIORITIES.HIGH
    );
  }

  /**
   * Crea notificación de carta robada
   * @param {string} gameCode - Código de la partida
   * @param {string} playerId - ID del jugador
   * @param {Object} card - Carta robada
   * @param {string} rule - Regla aplicada
   * @returns {Object} Notificación
   */
  static createCardDrawnNotification(gameCode, playerId, card, rule) {
    return this.createNotification(
      this.NOTIFICATION_TYPES.GAME_UPDATE,
      `${playerId} robó ${card.fullName}`,
      gameCode,
      playerId,
      { 
        action: 'card_drawn',
        card,
        rule,
        drawnBy: playerId
      },
      this.NOTIFICATION_PRIORITIES.MEDIUM
    );
  }

  /**
   * Crea notificación de regla aplicada
   * @param {string} gameCode - Código de la partida
   * @param {string} playerId - ID del jugador
   * @param {Object} card - Carta que activó la regla
   * @param {string} rule - Regla aplicada
   * @returns {Object} Notificación
   */
  static createRuleAppliedNotification(gameCode, playerId, card, rule) {
    return this.createNotification(
      this.NOTIFICATION_TYPES.RULE_TRIGGER,
      `Regla aplicada: ${rule}`,
      gameCode,
      playerId,
      { 
        action: 'rule_applied',
        card,
        rule,
        appliedTo: playerId
      },
      this.NOTIFICATION_PRIORITIES.MEDIUM
    );
  }

  /**
   * Crea notificación de cambio de turno
   * @param {string} gameCode - Código de la partida
   * @param {string} currentPlayer - Jugador actual
   * @param {string} previousPlayer - Jugador anterior
   * @returns {Object} Notificación
   */
  static createTurnChangeNotification(gameCode, currentPlayer, previousPlayer) {
    return this.createNotification(
      this.NOTIFICATION_TYPES.GAME_UPDATE,
      `Es el turno de ${currentPlayer}`,
      gameCode,
      currentPlayer,
      { 
        action: 'turn_changed',
        currentPlayer,
        previousPlayer
      },
      this.NOTIFICATION_PRIORITIES.MEDIUM
    );
  }

  /**
   * Crea notificación de rey robado
   * @param {string} gameCode - Código de la partida
   * @param {string} playerId - ID del jugador
   * @param {number} kingNumber - Número del rey
   * @param {boolean} gameEnded - Si el juego terminó
   * @returns {Object} Notificación
   */
  static createKingDrawnNotification(gameCode, playerId, kingNumber, gameEnded) {
    const message = gameEnded 
      ? `¡${playerId} robó el 4to Rey! La partida ha terminado`
      : `${playerId} robó el Rey #${kingNumber} - Copa del Rey`;

    return this.createNotification(
      gameEnded ? this.NOTIFICATION_TYPES.ERROR : this.NOTIFICATION_TYPES.WARNING,
      message,
      gameCode,
      playerId,
      { 
        action: 'king_drawn',
        kingNumber,
        gameEnded,
        drawnBy: playerId
      },
      gameEnded ? this.NOTIFICATION_PRIORITIES.CRITICAL : this.NOTIFICATION_PRIORITIES.HIGH
    );
  }

  /**
   * Crea notificación de venganza ganada
   * @param {string} gameCode - Código de la partida
   * @param {string} playerId - ID del jugador
   * @param {Object} card - Carta As
   * @returns {Object} Notificación
   */
  static createVenganzaEarnedNotification(gameCode, playerId, card) {
    return this.createNotification(
      this.NOTIFICATION_TYPES.SUCCESS,
      `¡${playerId} ganó una venganza!`,
      gameCode,
      playerId,
      { 
        action: 'venganza_earned',
        card,
        earnedBy: playerId
      },
      this.NOTIFICATION_PRIORITIES.HIGH
    );
  }

  /**
   * Crea notificación de venganza usada
   * @param {string} gameCode - Código de la partida
   * @param {string} playerId - ID del jugador que usa
   * @param {string} targetPlayerId - Jugador objetivo
   * @param {Object} venganzaCard - Carta de venganza
   * @returns {Object} Notificación
   */
  static createVenganzaUsedNotification(gameCode, playerId, targetPlayerId, venganzaCard) {
    return this.createNotification(
      this.NOTIFICATION_TYPES.PLAYER_ACTION,
      `${playerId} usó venganza contra ${targetPlayerId}`,
      gameCode,
      playerId,
      { 
        action: 'venganza_used',
        venganzaCard,
        targetPlayerId,
        usedBy: playerId
      },
      this.NOTIFICATION_PRIORITIES.HIGH
    );
  }

  /**
   * Crea notificación de carta guardada
   * @param {string} gameCode - Código de la partida
   * @param {string} playerId - ID del jugador
   * @param {Object} card - Carta guardada
   * @returns {Object} Notificación
   */
  static createCardSavedNotification(gameCode, playerId, card) {
    return this.createNotification(
      this.NOTIFICATION_TYPES.INFO,
      `${playerId} guardó ${card.fullName}`,
      gameCode,
      playerId,
      { 
        action: 'card_saved',
        card,
        savedBy: playerId
      },
      this.NOTIFICATION_PRIORITIES.MEDIUM
    );
  }

  /**
   * Crea notificación de brinco
   * @param {string} gameCode - Código de la partida
   * @param {string} playerId - ID del jugador
   * @param {boolean} success - Si fue exitoso
   * @param {string} result - Resultado del brinco
   * @returns {Object} Notificación
   */
  static createBrincoNotification(gameCode, playerId, success, result) {
    const message = success 
      ? `¡${playerId} completó el brinco exitosamente!`
      : `${playerId} falló el brinco`;

    return this.createNotification(
      success ? this.NOTIFICATION_TYPES.SUCCESS : this.NOTIFICATION_TYPES.WARNING,
      message,
      gameCode,
      playerId,
      { 
        action: 'brinco_result',
        success,
        result,
        executedBy: playerId
      },
      this.NOTIFICATION_PRIORITIES.HIGH
    );
  }

  /**
   * Crea notificación de movimiento
   * @param {string} gameCode - Código de la partida
   * @param {string} playerId - ID del jugador
   * @param {string} direction - Dirección del movimiento
   * @param {number} steps - Número de pasos
   * @returns {Object} Notificación
   */
  static createMovementNotification(gameCode, playerId, direction, steps) {
    return this.createNotification(
      this.NOTIFICATION_TYPES.PLAYER_ACTION,
      `${playerId} se movió ${steps} paso(s) hacia la ${direction === 'left' ? 'izquierda' : 'derecha'}`,
      gameCode,
      playerId,
      { 
        action: 'movement',
        direction,
        steps,
        executedBy: playerId
      },
      this.NOTIFICATION_PRIORITIES.MEDIUM
    );
  }

  /**
   * Crea notificación de partida terminada
   * @param {string} gameCode - Código de la partida
   * @param {string} reason - Razón del fin
   * @param {Object} finalStats - Estadísticas finales
   * @returns {Object} Notificación
   */
  static createGameEndedNotification(gameCode, reason, finalStats) {
    return this.createNotification(
      this.NOTIFICATION_TYPES.INFO,
      `La partida ${gameCode} ha terminado: ${reason}`,
      gameCode,
      null,
      { 
        action: 'game_ended',
        reason,
        finalStats
      },
      this.NOTIFICATION_PRIORITIES.HIGH
    );
  }

  /**
   * Crea notificación de error
   * @param {string} gameCode - Código de la partida
   * @param {string} error - Mensaje de error
   * @param {string} playerId - ID del jugador (opcional)
   * @returns {Object} Notificación
   */
  static createErrorNotification(gameCode, error, playerId = null) {
    return this.createNotification(
      this.NOTIFICATION_TYPES.ERROR,
      `Error: ${error}`,
      gameCode,
      playerId,
      { 
        action: 'error',
        error
      },
      this.NOTIFICATION_PRIORITIES.HIGH
    );
  }

  /**
   * Crea notificación de advertencia
   * @param {string} gameCode - Código de la partida
   * @param {string} warning - Mensaje de advertencia
   * @param {string} playerId - ID del jugador (opcional)
   * @returns {Object} Notificación
   */
  static createWarningNotification(gameCode, warning, playerId = null) {
    return this.createNotification(
      this.NOTIFICATION_TYPES.WARNING,
      `Advertencia: ${warning}`,
      gameCode,
      playerId,
      { 
        action: 'warning',
        warning
      },
      this.NOTIFICATION_PRIORITIES.MEDIUM
    );
  }

  /**
   * Crea notificación de sistema
   * @param {string} gameCode - Código de la partida
   * @param {string} message - Mensaje del sistema
   * @param {Object} data - Datos adicionales
   * @returns {Object} Notificación
   */
  static createSystemNotification(gameCode, message, data = {}) {
    return this.createNotification(
      this.NOTIFICATION_TYPES.SYSTEM,
      message,
      gameCode,
      null,
      { 
        action: 'system',
        ...data
      },
      this.NOTIFICATION_PRIORITIES.LOW
    );
  }

  /**
   * Crea notificación desde evento
   * @param {Object} event - Evento del juego
   * @returns {Object} Notificación
   */
  static createNotificationFromEvent(event) {
    switch (event.type) {
      case GameEventService.EVENT_TYPES.GAME_CREATED:
        return this.createGameCreatedNotification(event.gameCode, event.playerId);
      
      case GameEventService.EVENT_TYPES.PLAYER_JOINED:
        return this.createPlayerJoinedNotification(event.gameCode, event.playerId, event.data.playerCount);
      
      case GameEventService.EVENT_TYPES.PLAYER_LEFT:
        return this.createPlayerLeftNotification(event.gameCode, event.playerId, event.data.playerCount);
      
      case GameEventService.EVENT_TYPES.GAME_STARTED:
        return this.createGameStartedNotification(event.gameCode, event.data.players);
      
      case GameEventService.EVENT_TYPES.CARD_DRAWN:
        return this.createCardDrawnNotification(event.gameCode, event.playerId, event.data.card, event.data.rule);
      
      case GameEventService.EVENT_TYPES.RULE_APPLIED:
        return this.createRuleAppliedNotification(event.gameCode, event.playerId, event.data.card, event.data.rule);
      
      case GameEventService.EVENT_TYPES.TURN_CHANGED:
        return this.createTurnChangeNotification(event.gameCode, event.data.currentPlayer, event.data.previousPlayer);
      
      case GameEventService.EVENT_TYPES.COPA_REY_TRIGGERED:
        return this.createKingDrawnNotification(event.gameCode, event.playerId, event.data.kingNumber, event.data.gameEnded);
      
      case GameEventService.EVENT_TYPES.VENGANZA_USED:
        return this.createVenganzaUsedNotification(event.gameCode, event.playerId, event.data.targetPlayerId, event.data.venganzaCard);
      
      case GameEventService.EVENT_TYPES.CARD_SAVED:
        return this.createCardSavedNotification(event.gameCode, event.playerId, event.data.card);
      
      case GameEventService.EVENT_TYPES.BRINCO_EXECUTED:
        return this.createBrincoNotification(event.gameCode, event.playerId, event.data.success, event.data.result);
      
      case GameEventService.EVENT_TYPES.MOVEMENT_EXECUTED:
        return this.createMovementNotification(event.gameCode, event.playerId, event.data.direction, event.data.steps);
      
      case GameEventService.EVENT_TYPES.GAME_ENDED:
        return this.createGameEndedNotification(event.gameCode, event.data.reason, event.data.finalStats);
      
      default:
        return this.createSystemNotification(event.gameCode, `Evento: ${event.type}`, event.data);
    }
  }

  /**
   * Filtra notificaciones por jugador
   * @param {Array} notifications - Array de notificaciones
   * @param {string} playerId - ID del jugador
   * @returns {Array} Notificaciones filtradas
   */
  static filterNotificationsByPlayer(notifications, playerId) {
    return notifications.filter(notification => 
      notification.playerId === playerId || 
      notification.playerId === null // Notificaciones globales
    );
  }

  /**
   * Filtra notificaciones por tipo
   * @param {Array} notifications - Array de notificaciones
   * @param {string} type - Tipo de notificación
   * @returns {Array} Notificaciones filtradas
   */
  static filterNotificationsByType(notifications, type) {
    return notifications.filter(notification => notification.type === type);
  }

  /**
   * Filtra notificaciones por prioridad
   * @param {Array} notifications - Array de notificaciones
   * @param {string} priority - Prioridad mínima
   * @returns {Array} Notificaciones filtradas
   */
  static filterNotificationsByPriority(notifications, priority) {
    const priorityOrder = [
      this.NOTIFICATION_PRIORITIES.LOW,
      this.NOTIFICATION_PRIORITIES.MEDIUM,
      this.NOTIFICATION_PRIORITIES.HIGH,
      this.NOTIFICATION_PRIORITIES.CRITICAL
    ];
    
    const minPriorityIndex = priorityOrder.indexOf(priority);
    
    return notifications.filter(notification => {
      const notificationPriorityIndex = priorityOrder.indexOf(notification.priority);
      return notificationPriorityIndex >= minPriorityIndex;
    });
  }

  /**
   * Ordena notificaciones por timestamp
   * @param {Array} notifications - Array de notificaciones
   * @param {boolean} ascending - Orden ascendente
   * @returns {Array} Notificaciones ordenadas
   */
  static sortNotificationsByTime(notifications, ascending = false) {
    return notifications.sort((a, b) => {
      const timeA = a.timestamp.getTime();
      const timeB = b.timestamp.getTime();
      return ascending ? timeA - timeB : timeB - timeA;
    });
  }

  /**
   * Marca notificación como leída
   * @param {Object} notification - Notificación
   * @returns {Object} Notificación actualizada
   */
  static markAsRead(notification) {
    return {
      ...notification,
      read: true,
      readAt: new Date()
    };
  }

  /**
   * Convierte notificación a formato JSON
   * @param {Object} notification - Notificación
   * @returns {Object} Notificación en formato JSON
   */
  static notificationToJSON(notification) {
    return {
      ...notification,
      timestamp: notification.timestamp.toISOString(),
      readAt: notification.readAt ? notification.readAt.toISOString() : null
    };
  }

  /**
   * Convierte JSON a notificación
   * @param {Object} notificationData - Datos de la notificación
   * @returns {Object} Notificación
   */
  static notificationFromJSON(notificationData) {
    return {
      ...notificationData,
      timestamp: new Date(notificationData.timestamp),
      readAt: notificationData.readAt ? new Date(notificationData.readAt) : null
    };
  }

  /**
   * Valida una notificación
   * @param {Object} notification - Notificación a validar
   * @returns {boolean} True si es válida
   */
  static isValidNotification(notification) {
    if (!notification || typeof notification !== 'object') {
      return false;
    }

    const requiredFields = ['id', 'type', 'message', 'gameCode', 'timestamp'];
    for (const field of requiredFields) {
      if (!notification.hasOwnProperty(field)) {
        return false;
      }
    }

    // Validar tipo
    const validTypes = Object.values(this.NOTIFICATION_TYPES);
    if (!validTypes.includes(notification.type)) {
      return false;
    }

    // Validar prioridad
    const validPriorities = Object.values(this.NOTIFICATION_PRIORITIES);
    if (!validPriorities.includes(notification.priority)) {
      return false;
    }

    // Validar timestamp
    if (!(notification.timestamp instanceof Date)) {
      return false;
    }

    return true;
  }
}

module.exports = GameNotificationService;
