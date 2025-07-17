const { GameService } = require('../../domain/services');

/**
 * Caso de uso: Robar una carta del mazo
 */
class DrawCard {
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

      // Validar si el jugador puede robar una carta
      const validation = GameService.validateCardDraw(game, playerId);
      if (!validation.canDraw) {
        throw new Error(validation.reason);
      }

      // Robar la carta
      const drawnCard = game.drawCard(playerId);
      
      // Verificar si el juego debe terminar
      if (GameService.shouldGameEnd(game)) {
        game.endGame();
      }

      // Aplicar las reglas de la carta
      const ruleResult = GameService.applyCardRule(game, drawnCard, playerId);

      // Guardar los cambios
      const updatedGame = await this.gameRepository.save(game);

      const result = {
        success: true,
        data: {
          card: drawnCard.toJSON(),
          rule: ruleResult,
          game: GameService.getGameSummary(updatedGame, playerId),
          nextPlayer: updatedGame.getCurrentPlayer(),
          cardsRemaining: updatedGame.deck.length,
          isGameOver: updatedGame.isGameOver()
        }
      };

      // Información adicional según el tipo de carta
      switch (drawnCard.rank) {
        case 'A':
          result.data.venganzaInfo = {
            message: 'Carta de venganza guardada para el final del juego',
            totalVenganzas: updatedGame.venganzaCards.length
          };
          break;

        case 'K':
          result.data.kingsCupInfo = updatedGame.getKingsCupStatus();
          break;

        case '5':
        case '9':
          result.data.savedCardInfo = {
            message: `Carta ${drawnCard.rank} guardada para uso posterior`,
            savedCards: updatedGame.savedCards[playerId] || []
          };
          break;
      }

      return result;

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'DRAW_CARD_ERROR'
        }
      };
    }
  }
}

module.exports = DrawCard;
