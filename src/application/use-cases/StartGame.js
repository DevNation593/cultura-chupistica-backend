const { GameService } = require('../../domain/services');

/**
 * Caso de uso: Iniciar una partida
 */
class StartGame {
  constructor(gameRepository) {
    this.gameRepository = gameRepository;
  }

  /**
   * Ejecuta el caso de uso
   * @param {Object} params parámetros del caso de uso
   * @param {string} params.gameCode código de la partida
   * @param {string} params.playerId ID del jugador (debe ser el host)
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

      // Validar que el jugador sea el host
      if (game.host !== playerId) {
        throw new Error('Solo el host puede iniciar la partida');
      }

      // Validar si la partida puede iniciarse
      const validation = GameService.validateGameStart(game);
      if (!validation.canStart) {
        throw new Error(validation.reason);
      }

      // Iniciar la partida
      game.startGame();

      // Guardar los cambios
      const updatedGame = await this.gameRepository.save(game);

      return {
        success: true,
        data: {
          game: updatedGame.toJSON(),
          message: 'Partida iniciada exitosamente',
          gameInfo: {
            totalPlayers: updatedGame.players.length,
            totalCards: updatedGame.deck.length,
            currentPlayer: updatedGame.getCurrentPlayer(),
            startedAt: updatedGame.startedAt
          }
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'START_GAME_ERROR'
        }
      };
    }
  }
}

module.exports = StartGame;
