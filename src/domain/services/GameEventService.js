/**
 * Servicio de dominio para la gestión de eventos del juego
 */
class GameEventService {
  /**
   * Tipos de eventos disponibles
   */
  static get EVENT_TYPES() {
    return {
      GAME_CREATED: 'game_created',
      GAME_STARTED: 'game_started',
      GAME_ENDED: 'game_ended',
      PLAYER_JOINED: 'player_joined',
      PLAYER_LEFT: 'player_left',
      CARD_DRAWN: 'card_drawn',
      CARD_ACTIVATED: 'card_activated',
      TURN_CHANGED: 'turn_changed',
      RULE_APPLIED: 'rule_applied',
      VENGANZA_USED: 'venganza_used',
      COPA_REY_TRIGGERED: 'copa_rey_triggered',
      CARD_SAVED: 'card_saved',
      BRINCO_EXECUTED: 'brinco_executed',
      MOVEMENT_EXECUTED: 'movement_executed',
      GAME_STATE_CHANGED: 'game_state_changed'
    };
  }

  /**
   * Crea un evento de juego
   * @param {string} type - Tipo de evento
   * @param {string} gameCode - Código de la partida
   * @param {string} playerId - ID del jugador que disparó el evento
   * @param {Object} data - Datos adicionales del evento
   * @returns {Object} Evento creado
   */
  static createEvent(type, gameCode, playerId, data = {}) {
    const event = {
      id: this.generateEventId(),
      type,
      gameCode,
      playerId,
      timestamp: new Date(),
      data: { ...data }
    };

    return event;
  }

  /**
   * Genera un ID único para un evento
   * @returns {string} ID único
   */
  static generateEventId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Crea evento de creación de partida
   * @param {string} gameCode - Código de la partida
   * @param {string} hostId - ID del host
   * @returns {Object} Evento
   */
  static createGameCreatedEvent(gameCode, hostId) {
    return this.createEvent(
      this.EVENT_TYPES.GAME_CREATED,
      gameCode,
      hostId,
      { host: hostId }
    );
  }

  /**
   * Crea evento de inicio de partida
   * @param {string} gameCode - Código de la partida
   * @param {string} hostId - ID del host
   * @param {Array<string>} players - Lista de jugadores
   * @returns {Object} Evento
   */
  static createGameStartedEvent(gameCode, hostId, players) {
    return this.createEvent(
      this.EVENT_TYPES.GAME_STARTED,
      gameCode,
      hostId,
      { 
        players: [...players],
        playerCount: players.length
      }
    );
  }

  /**
   * Crea evento de fin de partida
   * @param {string} gameCode - Código de la partida
   * @param {string} playerId - ID del jugador que terminó
   * @param {string} reason - Razón del fin
   * @param {Object} finalStats - Estadísticas finales
   * @returns {Object} Evento
   */
  static createGameEndedEvent(gameCode, playerId, reason, finalStats = {}) {
    return this.createEvent(
      this.EVENT_TYPES.GAME_ENDED,
      gameCode,
      playerId,
      { 
        reason,
        finalStats,
        endedBy: playerId
      }
    );
  }

  /**
   * Crea evento de jugador que se une
   * @param {string} gameCode - Código de la partida
   * @param {string} playerId - ID del jugador
   * @param {number} playerCount - Número total de jugadores
   * @returns {Object} Evento
   */
  static createPlayerJoinedEvent(gameCode, playerId, playerCount) {
    return this.createEvent(
      this.EVENT_TYPES.PLAYER_JOINED,
      gameCode,
      playerId,
      { 
        newPlayer: playerId,
        playerCount
      }
    );
  }

  /**
   * Crea evento de jugador que se va
   * @param {string} gameCode - Código de la partida
   * @param {string} playerId - ID del jugador
   * @param {number} playerCount - Número total de jugadores restantes
   * @returns {Object} Evento
   */
  static createPlayerLeftEvent(gameCode, playerId, playerCount) {
    return this.createEvent(
      this.EVENT_TYPES.PLAYER_LEFT,
      gameCode,
      playerId,
      { 
        leftPlayer: playerId,
        playerCount
      }
    );
  }

  /**
   * Crea evento de carta robada
   * @param {string} gameCode - Código de la partida
   * @param {string} playerId - ID del jugador
   * @param {Object} card - Carta robada
   * @param {number} cardsRemaining - Cartas restantes
   * @returns {Object} Evento
   */
  static createCardDrawnEvent(gameCode, playerId, card, cardsRemaining) {
    return this.createEvent(
      this.EVENT_TYPES.CARD_DRAWN,
      gameCode,
      playerId,
      { 
        card,
        cardsRemaining,
        drawnBy: playerId
      }
    );
  }

  /**
   * Crea evento de carta activada
   * @param {string} gameCode - Código de la partida
   * @param {string} playerId - ID del jugador
   * @param {Object} card - Carta activada
   * @param {string} cardType - Tipo de activación
   * @param {string} targetPlayerId - Jugador objetivo (si aplica)
   * @returns {Object} Evento
   */
  static createCardActivatedEvent(gameCode, playerId, card, cardType, targetPlayerId = null) {
    return this.createEvent(
      this.EVENT_TYPES.CARD_ACTIVATED,
      gameCode,
      playerId,
      { 
        card,
        cardType,
        targetPlayerId,
        activatedBy: playerId
      }
    );
  }

  /**
   * Crea evento de cambio de turno
   * @param {string} gameCode - Código de la partida
   * @param {string} previousPlayer - Jugador anterior
   * @param {string} currentPlayer - Jugador actual
   * @param {number} turnIndex - Índice del turno
   * @returns {Object} Evento
   */
  static createTurnChangedEvent(gameCode, previousPlayer, currentPlayer, turnIndex) {
    return this.createEvent(
      this.EVENT_TYPES.TURN_CHANGED,
      gameCode,
      currentPlayer,
      { 
        previousPlayer,
        currentPlayer,
        turnIndex
      }
    );
  }

  /**
   * Crea evento de regla aplicada
   * @param {string} gameCode - Código de la partida
   * @param {string} playerId - ID del jugador
   * @param {Object} card - Carta que disparó la regla
   * @param {string} rule - Regla aplicada
   * @returns {Object} Evento
   */
  static createRuleAppliedEvent(gameCode, playerId, card, rule) {
    return this.createEvent(
      this.EVENT_TYPES.RULE_APPLIED,
      gameCode,
      playerId,
      { 
        card,
        rule,
        appliedTo: playerId
      }
    );
  }

  /**
   * Crea evento de venganza usada
   * @param {string} gameCode - Código de la partida
   * @param {string} playerId - ID del jugador que usa venganza
   * @param {string} targetPlayerId - Jugador objetivo
   * @param {Object} venganzaCard - Carta de venganza
   * @returns {Object} Evento
   */
  static createVenganzaUsedEvent(gameCode, playerId, targetPlayerId, venganzaCard) {
    return this.createEvent(
      this.EVENT_TYPES.VENGANZA_USED,
      gameCode,
      playerId,
      { 
        venganzaCard,
        targetPlayerId,
        usedBy: playerId
      }
    );
  }

  /**
   * Crea evento de copa del rey activada
   * @param {string} gameCode - Código de la partida
   * @param {string} playerId - ID del jugador
   * @param {number} kingNumber - Número del rey (1-4)
   * @param {boolean} gameEnded - Si el juego terminó
   * @returns {Object} Evento
   */
  static createCopaReyTriggeredEvent(gameCode, playerId, kingNumber, gameEnded) {
    return this.createEvent(
      this.EVENT_TYPES.COPA_REY_TRIGGERED,
      gameCode,
      playerId,
      { 
        kingNumber,
        gameEnded,
        triggeredBy: playerId
      }
    );
  }

  /**
   * Crea evento de carta guardada
   * @param {string} gameCode - Código de la partida
   * @param {string} playerId - ID del jugador
   * @param {Object} card - Carta guardada
   * @returns {Object} Evento
   */
  static createCardSavedEvent(gameCode, playerId, card) {
    return this.createEvent(
      this.EVENT_TYPES.CARD_SAVED,
      gameCode,
      playerId,
      { 
        card,
        savedBy: playerId
      }
    );
  }

  /**
   * Crea evento de brinco ejecutado
   * @param {string} gameCode - Código de la partida
   * @param {string} playerId - ID del jugador
   * @param {boolean} success - Si fue exitoso
   * @param {string} result - Resultado del brinco
   * @returns {Object} Evento
   */
  static createBrincoExecutedEvent(gameCode, playerId, success, result) {
    return this.createEvent(
      this.EVENT_TYPES.BRINCO_EXECUTED,
      gameCode,
      playerId,
      { 
        success,
        result,
        executedBy: playerId
      }
    );
  }

  /**
   * Crea evento de movimiento ejecutado
   * @param {string} gameCode - Código de la partida
   * @param {string} playerId - ID del jugador
   * @param {string} direction - Dirección del movimiento
   * @param {number} steps - Número de pasos
   * @returns {Object} Evento
   */
  static createMovementExecutedEvent(gameCode, playerId, direction, steps) {
    return this.createEvent(
      this.EVENT_TYPES.MOVEMENT_EXECUTED,
      gameCode,
      playerId,
      { 
        direction,
        steps,
        executedBy: playerId
      }
    );
  }

  /**
   * Crea evento de cambio de estado del juego
   * @param {string} gameCode - Código de la partida
   * @param {string} playerId - ID del jugador
   * @param {string} previousState - Estado anterior
   * @param {string} newState - Nuevo estado
   * @returns {Object} Evento
   */
  static createGameStateChangedEvent(gameCode, playerId, previousState, newState) {
    return this.createEvent(
      this.EVENT_TYPES.GAME_STATE_CHANGED,
      gameCode,
      playerId,
      { 
        previousState,
        newState,
        changedBy: playerId
      }
    );
  }

  /**
   * Valida que un evento sea válido
   * @param {Object} event - Evento a validar
   * @returns {boolean} True si es válido
   */
  static isValidEvent(event) {
    if (!event || typeof event !== 'object') {
      return false;
    }

    const requiredFields = ['id', 'type', 'gameCode', 'playerId', 'timestamp'];
    for (const field of requiredFields) {
      if (!event.hasOwnProperty(field)) {
        return false;
      }
    }

    // Validar tipo de evento
    const validTypes = Object.values(this.EVENT_TYPES);
    if (!validTypes.includes(event.type)) {
      return false;
    }

    // Validar timestamp
    if (!(event.timestamp instanceof Date)) {
      return false;
    }

    return true;
  }

  /**
   * Convierte un evento a formato JSON
   * @param {Object} event - Evento a convertir
   * @returns {Object} Evento en formato JSON
   */
  static eventToJSON(event) {
    return {
      ...event,
      timestamp: event.timestamp.toISOString()
    };
  }

  /**
   * Convierte un JSON a evento
   * @param {Object} eventData - Datos del evento
   * @returns {Object} Evento
   */
  static eventFromJSON(eventData) {
    return {
      ...eventData,
      timestamp: new Date(eventData.timestamp)
    };
  }
}

module.exports = GameEventService;
