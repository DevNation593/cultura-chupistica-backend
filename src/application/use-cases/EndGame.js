const { GameService } = require('../../domain/services');

/**
 * Caso de uso: Terminar una partida
 */
class EndGame {
  constructor(gameRepository) {
    this.gameRepository = gameRepository;
  }

  /**
   * Ejecuta el caso de uso
   * @param {Object} params parámetros del caso de uso
   * @param {string} params.gameCode código de la partida
   * @param {string} params.playerId ID del jugador (debe ser el host)
   * @param {string} params.reason motivo del fin (opcional)
   * @returns {Promise<Object>} resultado del caso de uso
   */
  async execute({ gameCode, playerId, reason = 'Terminada por el host' }) {
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
        throw new Error('Solo el host puede terminar la partida');
      }

      // Validar estado de la partida
      if (game.status === 'ended') {
        throw new Error('La partida ya ha terminado');
      }

      // Terminar la partida
      game.endGame();

      // Calcular estadísticas finales
      const finalStats = GameService.calculateDetailedStats(game);

      // Guardar los cambios
      const updatedGame = await this.gameRepository.save(game);

      return {
        success: true,
        data: {
          game: updatedGame.toJSON(),
          stats: finalStats,
          reason,
          message: 'Partida terminada exitosamente',
          finalInfo: {
            duration: updatedGame.endedAt - updatedGame.startedAt,
            totalCards: updatedGame.history.length,
            cardsRemaining: updatedGame.deck.length,
            winner: finalStats.basic.mostActivePlayer,
            venganzasAvailable: updatedGame.venganzaCards.length,
            kingsCupStatus: updatedGame.getKingsCupStatus()
          }
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'END_GAME_ERROR'
        }
      };
    }
  }

  /**
   * Termina automáticamente una partida (por sistema)
   * @param {Object} params parámetros
   * @param {string} params.gameCode código de la partida
   * @param {string} params.reason motivo del fin automático
   * @returns {Promise<Object>} resultado del caso de uso
   */
  async autoEnd({ gameCode, reason = 'Terminada automáticamente' }) {
    try {
      // Buscar la partida
      const game = await this.gameRepository.findByCode(gameCode);
      if (!game) {
        throw new Error('Partida no encontrada');
      }

      // Validar que la partida deba terminar automáticamente
      if (!GameService.shouldGameEnd(game)) {
        throw new Error('La partida no debe terminar automáticamente');
      }

      // Terminar la partida
      game.endGame();

      // Calcular estadísticas finales
      const finalStats = GameService.calculateDetailedStats(game);

      // Guardar los cambios
      const updatedGame = await this.gameRepository.save(game);

      return {
        success: true,
        data: {
          game: updatedGame.toJSON(),
          stats: finalStats,
          reason,
          message: 'Partida terminada automáticamente',
          autoEnd: true,
          finalInfo: {
            duration: updatedGame.endedAt - updatedGame.startedAt,
            totalCards: updatedGame.history.length,
            cardsRemaining: updatedGame.deck.length,
            winner: finalStats.basic.mostActivePlayer,
            venganzasAvailable: updatedGame.venganzaCards.length,
            kingsCupStatus: updatedGame.getKingsCupStatus()
          }
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'AUTO_END_GAME_ERROR'
        }
      };
    }
  }

  /**
   * Obtiene el resumen final de una partida terminada
   * @param {Object} params parámetros
   * @param {string} params.gameCode código de la partida
   * @returns {Promise<Object>} resumen final
   */
  async getFinalSummary({ gameCode }) {
    try {
      const game = await this.gameRepository.findByCode(gameCode);
      if (!game) {
        throw new Error('Partida no encontrada');
      }

      if (game.status !== 'ended') {
        throw new Error('La partida no ha terminado');
      }

      const finalStats = GameService.calculateDetailedStats(game);

      return {
        success: true,
        data: {
          game: game.toJSON(),
          stats: finalStats,
          summary: {
            code: game.code,
            duration: game.endedAt - game.startedAt,
            players: game.players,
            totalCards: game.history.length,
            cardsRemaining: game.deck.length,
            winner: finalStats.basic.mostActivePlayer,
            venganzasUsed: game.history.filter(h => h.isVenganza).length,
            venganzasAvailable: game.venganzaCards.length,
            kingsCupCompleted: game.kingsCount >= 4,
            specialEvents: game.history.filter(h => h.isActivated || h.isVenganza).length
          }
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'GET_FINAL_SUMMARY_ERROR'
        }
      };
    }
  }
}

module.exports = EndGame;
