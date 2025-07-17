const { GameService } = require('../../domain/services');

/**
 * Caso de uso: Obtener el estado de una partida
 */
class GetGameState {
  constructor(gameRepository) {
    this.gameRepository = gameRepository;
  }

  /**
   * Ejecuta el caso de uso
   * @param {Object} params parámetros del caso de uso
   * @param {string} params.gameCode código de la partida
   * @param {string} params.playerId ID del jugador (opcional)
   * @returns {Promise<Object>} resultado del caso de uso
   */
  async execute({ gameCode, playerId = null }) {
    try {
      // Validar parámetros
      if (!gameCode || typeof gameCode !== 'string') {
        throw new Error('El código de partida es requerido');
      }

      // Buscar la partida
      const game = await this.gameRepository.findByCode(gameCode);
      if (!game) {
        throw new Error('Partida no encontrada');
      }

      // Obtener resumen personalizado
      const gameSummary = GameService.getGameSummary(game, playerId);

      return {
        success: true,
        data: {
          game: gameSummary,
          fullGame: game.toJSON(),
          message: 'Estado de partida obtenido exitosamente'
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'GET_GAME_STATE_ERROR'
        }
      };
    }
  }

  /**
   * Obtiene el historial de una partida
   * @param {Object} params parámetros
   * @param {string} params.gameCode código de la partida
   * @param {number} params.limit límite de entradas (opcional)
   * @param {number} params.offset desplazamiento (opcional)
   * @returns {Promise<Object>} historial de la partida
   */
  async getHistory({ gameCode, limit = 50, offset = 0 }) {
    try {
      const game = await this.gameRepository.findByCode(gameCode);
      if (!game) {
        throw new Error('Partida no encontrada');
      }

      const history = game.history.slice(offset, offset + limit);
      
      return {
        success: true,
        data: {
          history,
          total: game.history.length,
          limit,
          offset,
          hasMore: offset + limit < game.history.length
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'GET_GAME_HISTORY_ERROR'
        }
      };
    }
  }

  /**
   * Obtiene las estadísticas de una partida
   * @param {Object} params parámetros
   * @param {string} params.gameCode código de la partida
   * @returns {Promise<Object>} estadísticas de la partida
   */
  async getStats({ gameCode }) {
    try {
      const game = await this.gameRepository.findByCode(gameCode);
      if (!game) {
        throw new Error('Partida no encontrada');
      }

      const stats = GameService.calculateDetailedStats(game);
      
      return {
        success: true,
        data: {
          stats,
          gameInfo: {
            code: game.code,
            status: game.status,
            players: game.players,
            cardsPlayed: game.history.length,
            cardsRemaining: game.deck.length,
            duration: game.startedAt ? Date.now() - game.startedAt : null
          }
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'GET_GAME_STATS_ERROR'
        }
      };
    }
  }
}

module.exports = GetGameState;
