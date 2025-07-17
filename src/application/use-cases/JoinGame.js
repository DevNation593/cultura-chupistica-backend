const { GameService } = require('../../domain/services');

/**
 * Caso de uso: Unirse a una partida existente
 */
class JoinGame {
  constructor(gameRepository) {
    this.gameRepository = gameRepository;
  }

  /**
   * Ejecuta el caso de uso
   * @param {Object} params parámetros del caso de uso
   * @param {string} params.gameCode código de la partida
   * @param {string} params.playerId ID del jugador
   * @returns {Promise<Object>} resultado del caso de uso
   */
  async execute({ gameCode, playerId }) {
    try {
      // Validar parámetros
      if (!gameCode || typeof gameCode !== 'string') {
        throw new Error('El código de partida es requerido');
      }

      if (!playerId || typeof playerId !== 'string') {
        throw new Error('El ID del jugador es requerido');
      }

      // Buscar la partida
      const game = await this.gameRepository.findByCode(gameCode);
      if (!game) {
        throw new Error('Partida no encontrada');
      }

      // Validar si el jugador puede unirse
      const validation = GameService.validatePlayerJoin(game, playerId);
      if (!validation.canJoin) {
        throw new Error(validation.reason);
      }

      // Añadir el jugador a la partida
      game.addPlayer(playerId);

      // Guardar los cambios
      const updatedGame = await this.gameRepository.save(game);

      return {
        success: true,
        data: {
          game: updatedGame.toJSON(),
          message: 'Te has unido a la partida exitosamente',
          playerCount: updatedGame.players.length
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'JOIN_GAME_ERROR'
        }
      };
    }
  }
}

module.exports = JoinGame;
