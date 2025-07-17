const { GameService } = require('../../domain/services');

/**
 * Caso de uso: Crear una nueva partida
 */
class CreateGame {
  constructor(gameRepository) {
    this.gameRepository = gameRepository;
  }

  /**
   * Ejecuta el caso de uso
   * @param {Object} params parámetros del caso de uso
   * @param {string} params.hostId ID del jugador host
   * @param {string} params.customCode código personalizado (opcional)
   * @returns {Promise<Object>} resultado del caso de uso
   */
  async execute({ hostId, customCode = null }) {
    try {
      // Validar parámetros
      if (!hostId || typeof hostId !== 'string') {
        throw new Error('El ID del host es requerido');
      }

      // Verificar si el código personalizado ya existe
      if (customCode) {
        const existingGame = await this.gameRepository.findByCode(customCode);
        if (existingGame) {
          throw new Error('El código de partida ya existe');
        }
      }

      // Generar código único si no se proporciona uno personalizado
      let gameCode = customCode;
      if (!gameCode) {
        do {
          gameCode = GameService.generateGameCode();
        } while (await this.gameRepository.findByCode(gameCode));
      }

      // Crear la nueva partida
      const game = GameService.createGame(hostId, gameCode);

      // Guardar la partida en el repositorio
      const savedGame = await this.gameRepository.save(game);

      return {
        success: true,
        data: {
          game: savedGame.toJSON(),
          message: 'Partida creada exitosamente'
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'CREATE_GAME_ERROR'
        }
      };
    }
  }
}

module.exports = CreateGame;
