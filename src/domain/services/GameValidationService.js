/**
 * Servicio de dominio para validaciones específicas del juego
 */
class GameValidationService {
  /**
   * Códigos de error de validación
   */
  static get ERROR_CODES() {
    return {
      INVALID_GAME_CODE: 'INVALID_GAME_CODE',
      INVALID_PLAYER_ID: 'INVALID_PLAYER_ID',
      INVALID_CARD: 'INVALID_CARD',
      INVALID_GAME_STATE: 'INVALID_GAME_STATE',
      PLAYER_NOT_FOUND: 'PLAYER_NOT_FOUND',
      PLAYER_ALREADY_EXISTS: 'PLAYER_ALREADY_EXISTS',
      GAME_FULL: 'GAME_FULL',
      GAME_NOT_STARTED: 'GAME_NOT_STARTED',
      GAME_ALREADY_ENDED: 'GAME_ALREADY_ENDED',
      NOT_PLAYER_TURN: 'NOT_PLAYER_TURN',
      CARD_NOT_FOUND: 'CARD_NOT_FOUND',
      CARD_ALREADY_ACTIVATED: 'CARD_ALREADY_ACTIVATED',
      INVALID_CARD_TYPE: 'INVALID_CARD_TYPE',
      INVALID_TARGET_PLAYER: 'INVALID_TARGET_PLAYER',
      NO_VENGANZA_AVAILABLE: 'NO_VENGANZA_AVAILABLE',
      INVALID_BRINCO_RESULT: 'INVALID_BRINCO_RESULT',
      INVALID_MOVEMENT_DIRECTION: 'INVALID_MOVEMENT_DIRECTION',
      INVALID_RULES: 'INVALID_RULES',
      DECK_EMPTY: 'DECK_EMPTY',
      INVALID_KING_COUNT: 'INVALID_KING_COUNT'
    };
  }

  /**
   * Valida un código de partida
   * @param {string} gameCode - Código a validar
   * @returns {Object} Resultado de validación
   */
  static validateGameCode(gameCode) {
    const result = {
      isValid: false,
      errorCode: null,
      message: null
    };

    if (!gameCode) {
      result.errorCode = this.ERROR_CODES.INVALID_GAME_CODE;
      result.message = 'Código de partida es requerido';
      return result;
    }

    if (typeof gameCode !== 'string') {
      result.errorCode = this.ERROR_CODES.INVALID_GAME_CODE;
      result.message = 'Código de partida debe ser una cadena';
      return result;
    }

    if (gameCode.length < 4 || gameCode.length > 10) {
      result.errorCode = this.ERROR_CODES.INVALID_GAME_CODE;
      result.message = 'Código de partida debe tener entre 4 y 10 caracteres';
      return result;
    }

    // Validar que solo contenga letras y números
    const validPattern = /^[A-Z0-9]+$/;
    if (!validPattern.test(gameCode)) {
      result.errorCode = this.ERROR_CODES.INVALID_GAME_CODE;
      result.message = 'Código de partida solo puede contener letras y números';
      return result;
    }

    result.isValid = true;
    return result;
  }

  /**
   * Valida un ID de jugador
   * @param {string} playerId - ID a validar
   * @returns {Object} Resultado de validación
   */
  static validatePlayerId(playerId) {
    const result = {
      isValid: false,
      errorCode: null,
      message: null
    };

    if (!playerId) {
      result.errorCode = this.ERROR_CODES.INVALID_PLAYER_ID;
      result.message = 'ID de jugador es requerido';
      return result;
    }

    if (typeof playerId !== 'string') {
      result.errorCode = this.ERROR_CODES.INVALID_PLAYER_ID;
      result.message = 'ID de jugador debe ser una cadena';
      return result;
    }

    if (playerId.trim().length === 0) {
      result.errorCode = this.ERROR_CODES.INVALID_PLAYER_ID;
      result.message = 'ID de jugador no puede estar vacío';
      return result;
    }

    if (playerId.length > 50) {
      result.errorCode = this.ERROR_CODES.INVALID_PLAYER_ID;
      result.message = 'ID de jugador no puede tener más de 50 caracteres';
      return result;
    }

    result.isValid = true;
    return result;
  }

  /**
   * Valida una carta
   * @param {Object} card - Carta a validar
   * @returns {Object} Resultado de validación
   */
  static validateCard(card) {
    const result = {
      isValid: false,
      errorCode: null,
      message: null
    };

    if (!card) {
      result.errorCode = this.ERROR_CODES.INVALID_CARD;
      result.message = 'Carta es requerida';
      return result;
    }

    if (!card.suit || !card.rank) {
      result.errorCode = this.ERROR_CODES.INVALID_CARD;
      result.message = 'Carta debe tener palo y valor';
      return result;
    }

    const validSuits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const validRanks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    if (!validSuits.includes(card.suit)) {
      result.errorCode = this.ERROR_CODES.INVALID_CARD;
      result.message = 'Palo de carta inválido';
      return result;
    }

    if (!validRanks.includes(card.rank)) {
      result.errorCode = this.ERROR_CODES.INVALID_CARD;
      result.message = 'Valor de carta inválido';
      return result;
    }

    result.isValid = true;
    return result;
  }

  /**
   * Valida que un jugador pueda unirse a una partida
   * @param {Object} game - Partida
   * @param {string} playerId - ID del jugador
   * @returns {Object} Resultado de validación
   */
  static validatePlayerJoin(game, playerId) {
    const result = {
      isValid: false,
      errorCode: null,
      message: null
    };

    // Validar ID del jugador
    const playerValidation = this.validatePlayerId(playerId);
    if (!playerValidation.isValid) {
      return playerValidation;
    }

    // Validar estado del juego
    if (game.status !== 'waiting') {
      result.errorCode = this.ERROR_CODES.INVALID_GAME_STATE;
      result.message = 'La partida ya ha comenzado o terminado';
      return result;
    }

    // Validar que el jugador no esté ya en la partida
    if (game.players.includes(playerId)) {
      result.errorCode = this.ERROR_CODES.PLAYER_ALREADY_EXISTS;
      result.message = 'El jugador ya está en la partida';
      return result;
    }

    // Validar límite de jugadores
    if (game.players.length >= 8) {
      result.errorCode = this.ERROR_CODES.GAME_FULL;
      result.message = 'La partida está llena';
      return result;
    }

    result.isValid = true;
    return result;
  }

  /**
   * Valida que un jugador pueda robar una carta
   * @param {Object} game - Partida
   * @param {string} playerId - ID del jugador
   * @returns {Object} Resultado de validación
   */
  static validateCardDraw(game, playerId) {
    const result = {
      isValid: false,
      errorCode: null,
      message: null
    };

    // Validar ID del jugador
    const playerValidation = this.validatePlayerId(playerId);
    if (!playerValidation.isValid) {
      return playerValidation;
    }

    // Validar estado del juego
    if (game.status !== 'started') {
      result.errorCode = this.ERROR_CODES.GAME_NOT_STARTED;
      result.message = 'La partida no ha comenzado';
      return result;
    }

    // Validar que el jugador esté en la partida
    if (!game.players.includes(playerId)) {
      result.errorCode = this.ERROR_CODES.PLAYER_NOT_FOUND;
      result.message = 'El jugador no está en la partida';
      return result;
    }

    // Validar que sea el turno del jugador
    const currentPlayer = game.players[game.currentTurn];
    if (currentPlayer !== playerId) {
      result.errorCode = this.ERROR_CODES.NOT_PLAYER_TURN;
      result.message = 'No es el turno del jugador';
      return result;
    }

    // Validar que haya cartas en el mazo
    if (game.deck.length === 0) {
      result.errorCode = this.ERROR_CODES.DECK_EMPTY;
      result.message = 'No hay cartas en el mazo';
      return result;
    }

    result.isValid = true;
    return result;
  }

  /**
   * Valida que un jugador pueda activar una carta
   * @param {Object} game - Partida
   * @param {string} playerId - ID del jugador
   * @param {string} cardType - Tipo de carta
   * @param {string} targetPlayerId - Jugador objetivo (opcional)
   * @returns {Object} Resultado de validación
   */
  static validateCardActivation(game, playerId, cardType, targetPlayerId = null) {
    const result = {
      isValid: false,
      errorCode: null,
      message: null
    };

    // Validar ID del jugador
    const playerValidation = this.validatePlayerId(playerId);
    if (!playerValidation.isValid) {
      return playerValidation;
    }

    // Validar estado del juego
    if (game.status !== 'started') {
      result.errorCode = this.ERROR_CODES.GAME_NOT_STARTED;
      result.message = 'La partida no ha comenzado';
      return result;
    }

    // Validar que el jugador esté en la partida
    if (!game.players.includes(playerId)) {
      result.errorCode = this.ERROR_CODES.PLAYER_NOT_FOUND;
      result.message = 'El jugador no está en la partida';
      return result;
    }

    // Validar tipo de carta
    const validCardTypes = ['brinco', 'movement', 'venganza'];
    if (!validCardTypes.includes(cardType)) {
      result.errorCode = this.ERROR_CODES.INVALID_CARD_TYPE;
      result.message = 'Tipo de carta inválido';
      return result;
    }

    // Validar venganza específicamente
    if (cardType === 'venganza') {
      if (!targetPlayerId) {
        result.errorCode = this.ERROR_CODES.INVALID_TARGET_PLAYER;
        result.message = 'La venganza requiere un jugador objetivo';
        return result;
      }

      if (!game.players.includes(targetPlayerId)) {
        result.errorCode = this.ERROR_CODES.INVALID_TARGET_PLAYER;
        result.message = 'El jugador objetivo no está en la partida';
        return result;
      }

      // Verificar que el jugador tenga venganzas disponibles
      const playerVenganzas = game.venganzaCards.filter(v => v.playerId === playerId);
      if (playerVenganzas.length === 0) {
        result.errorCode = this.ERROR_CODES.NO_VENGANZA_AVAILABLE;
        result.message = 'No tienes venganzas disponibles';
        return result;
      }
    }

    result.isValid = true;
    return result;
  }

  /**
   * Valida un resultado de brinco
   * @param {string} brincoResult - Resultado del brinco
   * @returns {Object} Resultado de validación
   */
  static validateBrincoResult(brincoResult) {
    const result = {
      isValid: false,
      errorCode: null,
      message: null
    };

    if (!brincoResult) {
      result.errorCode = this.ERROR_CODES.INVALID_BRINCO_RESULT;
      result.message = 'Resultado de brinco es requerido';
      return result;
    }

    const validResults = ['success', 'failure'];
    if (!validResults.includes(brincoResult)) {
      result.errorCode = this.ERROR_CODES.INVALID_BRINCO_RESULT;
      result.message = 'Resultado de brinco inválido';
      return result;
    }

    result.isValid = true;
    return result;
  }

  /**
   * Valida una dirección de movimiento
   * @param {string} direction - Dirección del movimiento
   * @returns {Object} Resultado de validación
   */
  static validateMovementDirection(direction) {
    const result = {
      isValid: false,
      errorCode: null,
      message: null
    };

    if (!direction) {
      result.errorCode = this.ERROR_CODES.INVALID_MOVEMENT_DIRECTION;
      result.message = 'Dirección de movimiento es requerida';
      return result;
    }

    const validDirections = ['left', 'right'];
    if (!validDirections.includes(direction)) {
      result.errorCode = this.ERROR_CODES.INVALID_MOVEMENT_DIRECTION;
      result.message = 'Dirección de movimiento inválida';
      return result;
    }

    result.isValid = true;
    return result;
  }

  /**
   * Valida reglas de juego
   * @param {Object} rules - Reglas a validar
   * @returns {Object} Resultado de validación
   */
  static validateGameRules(rules) {
    const result = {
      isValid: false,
      errorCode: null,
      message: null
    };

    if (!rules || typeof rules !== 'object') {
      result.errorCode = this.ERROR_CODES.INVALID_RULES;
      result.message = 'Las reglas deben ser un objeto';
      return result;
    }

    const validRanks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const ruleKeys = Object.keys(rules);

    for (const rank of ruleKeys) {
      if (!validRanks.includes(rank)) {
        result.errorCode = this.ERROR_CODES.INVALID_RULES;
        result.message = `Carta inválida en las reglas: ${rank}`;
        return result;
      }

      const rule = rules[rank];
      if (!rule || typeof rule !== 'string' || rule.trim().length === 0) {
        result.errorCode = this.ERROR_CODES.INVALID_RULES;
        result.message = `Regla inválida para la carta ${rank}`;
        return result;
      }
    }

    result.isValid = true;
    return result;
  }

  /**
   * Valida el estado de una partida
   * @param {Object} game - Partida a validar
   * @returns {Object} Resultado de validación
   */
  static validateGameState(game) {
    const result = {
      isValid: false,
      errorCode: null,
      message: null,
      warnings: []
    };

    if (!game) {
      result.errorCode = this.ERROR_CODES.INVALID_GAME_STATE;
      result.message = 'Partida es requerida';
      return result;
    }

    // Validar código de partida
    const codeValidation = this.validateGameCode(game.code);
    if (!codeValidation.isValid) {
      result.errorCode = codeValidation.errorCode;
      result.message = codeValidation.message;
      return result;
    }

    // Validar jugadores
    if (!game.players || !Array.isArray(game.players)) {
      result.errorCode = this.ERROR_CODES.INVALID_GAME_STATE;
      result.message = 'Lista de jugadores inválida';
      return result;
    }

    if (game.players.length === 0) {
      result.errorCode = this.ERROR_CODES.INVALID_GAME_STATE;
      result.message = 'Debe haber al menos un jugador';
      return result;
    }

    // Validar host
    if (!game.host || !game.players.includes(game.host)) {
      result.errorCode = this.ERROR_CODES.INVALID_GAME_STATE;
      result.message = 'El host debe estar en la lista de jugadores';
      return result;
    }

    // Validar turno actual
    if (game.currentTurn >= game.players.length) {
      result.errorCode = this.ERROR_CODES.INVALID_GAME_STATE;
      result.message = 'Turno actual inválido';
      return result;
    }

    // Validar contador de reyes
    if (game.kingsCount < 0 || game.kingsCount > 4) {
      result.errorCode = this.ERROR_CODES.INVALID_KING_COUNT;
      result.message = 'Contador de reyes inválido';
      return result;
    }

    // Advertencias
    if (game.players.length > 8) {
      result.warnings.push('Más de 8 jugadores puede afectar el rendimiento');
    }

    if (game.deck && game.deck.length === 0 && game.status === 'started') {
      result.warnings.push('El mazo está vacío pero el juego sigue activo');
    }

    result.isValid = true;
    return result;
  }

  /**
   * Crea un resultado de validación exitoso
   * @returns {Object} Resultado exitoso
   */
  static createSuccessResult() {
    return {
      isValid: true,
      errorCode: null,
      message: null
    };
  }

  /**
   * Crea un resultado de validación fallido
   * @param {string} errorCode - Código de error
   * @param {string} message - Mensaje de error
   * @returns {Object} Resultado fallido
   */
  static createErrorResult(errorCode, message) {
    return {
      isValid: false,
      errorCode,
      message
    };
  }
}

module.exports = GameValidationService;
