const { GameService } = require('../../domain/services');

/**
 * Caso de uso: Actualizar reglas de una partida
 */
class UpdateRules {
  constructor(gameRepository) {
    this.gameRepository = gameRepository;
  }

  /**
   * Ejecuta el caso de uso
   * @param {Object} params parámetros del caso de uso
   * @param {string} params.gameCode código de la partida
   * @param {string} params.playerId ID del jugador (debe ser el host)
   * @param {Object} params.newRules nuevas reglas
   * @returns {Promise<Object>} resultado del caso de uso
   */
  async execute({ gameCode, playerId, newRules }) {
    try {
      // Validar parámetros
      if (!gameCode || typeof gameCode !== 'string') {
        throw new Error('El código de partida es requerido');
      }

      if (!playerId || typeof playerId !== 'string') {
        throw new Error('El ID del jugador es requerido');
      }

      if (!newRules || typeof newRules !== 'object') {
        throw new Error('Las nuevas reglas son requeridas');
      }

      // Buscar la partida
      const game = await this.gameRepository.findByCode(gameCode);
      if (!game) {
        throw new Error('Partida no encontrada');
      }

      // Validar que el jugador sea el host
      if (game.host !== playerId) {
        throw new Error('Solo el host puede actualizar las reglas');
      }

      // Validar que la partida esté en espera
      if (game.status !== 'waiting') {
        throw new Error('Solo se pueden actualizar las reglas antes de iniciar la partida');
      }

      // Validar las reglas
      const validRanks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      const invalidRanks = Object.keys(newRules).filter(rank => !validRanks.includes(rank));
      
      if (invalidRanks.length > 0) {
        throw new Error(`Cartas inválidas: ${invalidRanks.join(', ')}`);
      }

      // Actualizar las reglas
      game.updateRules(newRules);

      // Guardar los cambios
      const updatedGame = await this.gameRepository.save(game);

      return {
        success: true,
        data: {
          game: updatedGame.toJSON(),
          updatedRules: newRules,
          currentRules: updatedGame.rules,
          message: 'Reglas actualizadas exitosamente'
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'UPDATE_RULES_ERROR'
        }
      };
    }
  }

  /**
   * Obtiene las reglas actuales de una partida
   * @param {Object} params parámetros
   * @param {string} params.gameCode código de la partida
   * @returns {Promise<Object>} reglas actuales
   */
  async getRules({ gameCode }) {
    try {
      const game = await this.gameRepository.findByCode(gameCode);
      if (!game) {
        throw new Error('Partida no encontrada');
      }

      return {
        success: true,
        data: {
          rules: game.rules,
          canEdit: game.status === 'waiting',
          message: 'Reglas obtenidas exitosamente'
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'GET_RULES_ERROR'
        }
      };
    }
  }

  /**
   * Restablece las reglas a las por defecto
   * @param {Object} params parámetros
   * @param {string} params.gameCode código de la partida
   * @param {string} params.playerId ID del jugador (debe ser el host)
   * @returns {Promise<Object>} resultado del caso de uso
   */
  async resetRules({ gameCode, playerId }) {
    try {
      const game = await this.gameRepository.findByCode(gameCode);
      if (!game) {
        throw new Error('Partida no encontrada');
      }

      if (game.host !== playerId) {
        throw new Error('Solo el host puede restablecer las reglas');
      }

      if (game.status !== 'waiting') {
        throw new Error('Solo se pueden restablecer las reglas antes de iniciar la partida');
      }

      // Restablecer a reglas por defecto
      game.rules = game._getDefaultRules();

      // Guardar los cambios
      const updatedGame = await this.gameRepository.save(game);

      return {
        success: true,
        data: {
          game: updatedGame.toJSON(),
          rules: updatedGame.rules,
          message: 'Reglas restablecidas a las por defecto'
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'RESET_RULES_ERROR'
        }
      };
    }
  }
}

module.exports = UpdateRules;
