const Game = require('../models/Game');
const CardService = require('./CardService');

/**
 * Servicio de dominio para operaciones relacionadas con partidas
 */
class GameService {
  /**
   * Genera un código único para una partida
   * @param {number} length longitud del código
   * @returns {string} código único
   */
  static generateGameCode(length = 6) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    for (let i = 0; i < length; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return code;
  }

  /**
   * Crea una nueva partida
   * @param {string} hostId ID del jugador host
   * @param {string} code código de la partida (opcional)
   * @returns {Game} nueva partida
   */
  static createGame(hostId, code = null) {
    const gameCode = code || this.generateGameCode();
    return new Game(gameCode, hostId);
  }

  /**
   * Valida que un jugador pueda unirse a una partida
   * @param {Game} game partida
   * @param {string} playerId ID del jugador
   * @returns {Object} resultado de la validación
   */
  static validatePlayerJoin(game, playerId) {
    const result = {
      canJoin: false,
      reason: null
    };

    if (game.status !== 'waiting') {
      result.reason = 'La partida ya ha comenzado o ha terminado';
      return result;
    }

    if (game.players.includes(playerId)) {
      result.reason = 'El jugador ya está en la partida';
      return result;
    }

    if (game.players.length >= 8) {
      result.reason = 'La partida está completa (máximo 8 jugadores)';
      return result;
    }

    result.canJoin = true;
    return result;
  }

  /**
   * Valida que una partida pueda iniciarse
   * @param {Game} game partida
   * @returns {Object} resultado de la validación
   */
  static validateGameStart(game) {
    const result = {
      canStart: false,
      reason: null
    };

    if (game.status !== 'waiting') {
      result.reason = 'La partida ya ha comenzado o ha terminado';
      return result;
    }

    if (game.players.length < 2) {
      result.reason = 'Se necesitan al menos 2 jugadores para iniciar';
      return result;
    }

    result.canStart = true;
    return result;
  }

  /**
   * Valida que un jugador pueda robar una carta
   * @param {Game} game partida
   * @param {string} playerId ID del jugador
   * @returns {Object} resultado de la validación
   */
  static validateCardDraw(game, playerId) {
    const result = {
      canDraw: false,
      reason: null
    };

    if (game.status !== 'started') {
      result.reason = 'La partida no ha comenzado';
      return result;
    }

    if (game.getCurrentPlayer() !== playerId) {
      result.reason = 'No es el turno de este jugador';
      return result;
    }

    if (game.deck.length === 0) {
      result.reason = 'No hay más cartas en la baraja';
      return result;
    }

    result.canDraw = true;
    return result;
  }

  /**
   * Obtiene el jugador siguiente en el turno
   * @param {Game} game partida
   * @returns {string} ID del siguiente jugador
   */
  static getNextPlayer(game) {
    const nextTurn = (game.currentTurn + 1) % game.players.length;
    return game.players[nextTurn];
  }

  /**
   * Obtiene el jugador anterior en el turno
   * @param {Game} game partida
   * @returns {string} ID del jugador anterior
   */
  static getPreviousPlayer(game) {
    const prevTurn = (game.currentTurn - 1 + game.players.length) % game.players.length;
    return game.players[prevTurn];
  }

  /**
   * Obtiene el jugador a la izquierda del actual
   * @param {Game} game partida
   * @returns {string} ID del jugador a la izquierda
   */
  static getLeftPlayer(game) {
    return this.getNextPlayer(game);
  }

  /**
   * Obtiene el jugador a la derecha del actual
   * @param {Game} game partida
   * @returns {string} ID del jugador a la derecha
   */
  static getRightPlayer(game) {
    return this.getPreviousPlayer(game);
  }

  /**
   * Aplica las reglas específicas de una carta
   * @param {Game} game partida
   * @param {Card} card carta robada
   * @param {string} playerId jugador que robó la carta
   * @returns {Object} resultado de aplicar la regla
   */
  static applyCardRule(game, card, playerId) {
    const result = {
      action: null,
      targetPlayer: null,
      message: null,
      requiresUserInput: false,
      options: null
    };

    switch (card.rank) {
      case 'A':
        result.action = 'venganza_saved';
        result.message = 'Carta de venganza guardada para el final del juego';
        break;

      case '2':
        result.action = 'drink_self';
        result.targetPlayer = playerId;
        result.message = 'A vos - Toma la persona que sacó la carta';
        break;

      case '3':
        result.action = 'yo_nunca_nunca';
        result.message = 'Yo nunca nunca - Alzen 3 dedos y empiecen el juego';
        result.requiresUserInput = true;
        break;

      case '4':
        result.action = 'choose_rule';
        result.message = 'Elige la regla para el 4';
        result.requiresUserInput = true;
        result.options = ['Al más gato (ojos más claros)', 'Mi barquito'];
        break;

      case '5':
        result.action = 'card_saved';
        result.message = 'Carta Al brinco guardada - Úsala cuando quieras';
        break;

      case '6':
        result.action = 'drink_first_seen';
        result.message = 'Al que vez - La primera persona a la que veas tiene que tomar';
        result.requiresUserInput = true;
        break;

      case '7':
        result.action = 'siete_pum';
        result.message = '7 pum - Empiecen a contar, los números con 7 se dicen PUM';
        result.requiresUserInput = true;
        break;

      case '8':
        result.action = 'choose_rule';
        result.message = 'Elige la regla para el 8';
        result.requiresUserInput = true;
        result.options = ['Al más joven', 'Colores (rojos: más pequeño, negros: más grande)'];
        break;

      case '9':
        result.action = 'card_saved';
        result.message = 'Carta Al que se mueve guardada - Úsala cuando quieras';
        break;

      case '10':
        result.action = 'choose_rule';
        result.message = 'Elige la regla para el 10';
        result.requiresUserInput = true;
        result.options = ['Al juez (quien está sirviendo)', 'Historia'];
        break;

      case 'J':
        result.action = 'drink_left';
        result.targetPlayer = this.getLeftPlayer(game);
        result.message = 'El jugador de la izquierda toma';
        break;

      case 'Q':
        result.action = 'drink_right';
        result.targetPlayer = this.getRightPlayer(game);
        result.message = 'El jugador de la derecha toma';
        break;

      case 'K':
        result.action = 'kings_cup';
        result.message = this.getKingsCupMessage(game.kingsCount);
        break;
    }

    return result;
  }

  /**
   * Obtiene el mensaje apropiado para la Copa del Rey
   * @param {number} kingsCount número de cartas K sacadas
   * @returns {string} mensaje
   */
  static getKingsCupMessage(kingsCount) {
    switch (kingsCount) {
      case 1:
        return 'Primera K - Llena 1/4 del vaso con licor';
      case 2:
        return 'Segunda K - Añade más al vaso';
      case 3:
        return 'Tercera K - Completa más el vaso';
      case 4:
        return 'Cuarta K - Llena completamente el vaso y tómatelo todo';
      default:
        return 'Copa del Rey completada';
    }
  }

  /**
   * Calcula las estadísticas detalladas de una partida
   * @param {Game} game partida
   * @returns {Object} estadísticas detalladas
   */
  static calculateDetailedStats(game) {
    const stats = {
      basic: game.getStats(),
      advanced: {
        cardsByRank: {},
        cardsBySuit: {},
        specialCards: {
          venganzas: game.venganzaCards.length,
          savedCards: Object.values(game.savedCards).reduce((total, cards) => total + cards.length, 0),
          kingsDrawn: game.kingsCount
        },
        timeline: [],
        playerActivity: {}
      }
    };

    // Análisis por valor de carta
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    ranks.forEach(rank => {
      stats.advanced.cardsByRank[rank] = game.history.filter(h => h.card.rank === rank).length;
    });

    // Análisis por palo
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    suits.forEach(suit => {
      stats.advanced.cardsBySuit[suit] = game.history.filter(h => h.card.suit === suit).length;
    });

    // Timeline de eventos importantes
    stats.advanced.timeline = game.history
      .filter(h => ['A', 'K'].includes(h.card.rank) || h.isActivated)
      .map(h => ({
        timestamp: h.timestamp,
        playerId: h.playerId,
        cardRank: h.card.rank,
        isActivated: h.isActivated || false,
        isVenganza: h.isVenganza || false
      }));

    // Actividad detallada por jugador
    game.players.forEach(playerId => {
      const playerHistory = game.history.filter(h => h.playerId === playerId);
      stats.advanced.playerActivity[playerId] = {
        totalCards: playerHistory.length,
        redCards: playerHistory.filter(h => ['hearts', 'diamonds'].includes(h.card.suit)).length,
        blackCards: playerHistory.filter(h => ['clubs', 'spades'].includes(h.card.suit)).length,
        faceCards: playerHistory.filter(h => ['J', 'Q', 'K'].includes(h.card.rank)).length,
        specialCards: playerHistory.filter(h => ['A', '5', '9'].includes(h.card.rank)).length,
        activatedCards: playerHistory.filter(h => h.isActivated).length,
        venganzas: game.venganzaCards.filter(v => v.playerId === playerId).length,
        savedCards: (game.savedCards[playerId] || []).length
      };
    });

    return stats;
  }

  /**
   * Determina si una partida debe terminar automáticamente
   * @param {Game} game partida
   * @returns {boolean} true si debe terminar
   */
  static shouldGameEnd(game) {
    // Terminar si no hay más cartas
    if (game.deck.length === 0) {
      return true;
    }

    // Terminar si solo queda un jugador
    if (game.players.length <= 1) {
      return true;
    }

    return false;
  }

  /**
   * Valida el estado de una partida
   * @param {Game} game partida
   * @returns {Object} resultado de la validación
   */
  static validateGameState(game) {
    const issues = [];

    // Validar jugadores
    if (game.players.length === 0) {
      issues.push('No hay jugadores en la partida');
    }

    if (!game.players.includes(game.host)) {
      issues.push('El host no está en la lista de jugadores');
    }

    // Validar turno
    if (game.status === 'started' && game.currentTurn >= game.players.length) {
      issues.push('El turno actual es inválido');
    }

    // Validar baraja
    if (game.status === 'started' && game.deck.length === 0 && game.status !== 'ended') {
      issues.push('La baraja está vacía pero el juego no ha terminado');
    }

    // Validar cartas guardadas
    Object.entries(game.savedCards).forEach(([playerId, cards]) => {
      if (!game.players.includes(playerId)) {
        issues.push(`Jugador ${playerId} tiene cartas guardadas pero no está en la partida`);
      }
      
      if (cards.length > 3) {
        issues.push(`Jugador ${playerId} tiene más de 3 cartas guardadas`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Obtiene el resumen de una partida para mostrar al cliente
   * @param {Game} game partida
   * @param {string} playerId ID del jugador (opcional, para información personalizada)
   * @returns {Object} resumen de la partida
   */
  static getGameSummary(game, playerId = null) {
    const summary = {
      code: game.code,
      status: game.status,
      players: game.players,
      host: game.host,
      currentPlayer: game.getCurrentPlayer(),
      cardsRemaining: game.deck.length,
      isMyTurn: playerId ? game.getCurrentPlayer() === playerId : false,
      kingsCup: game.getKingsCupStatus(),
      availableVenganzas: game.venganzaCards.length
    };

    if (playerId) {
      summary.mySavedCards = game.savedCards[playerId] || [];
      summary.myVenganzas = game.venganzaCards.filter(v => v.playerId === playerId);
    }

    if (game.status === 'ended') {
      summary.stats = this.calculateDetailedStats(game);
    }

    return summary;
  }
}

module.exports = GameService;
