const { GameService } = require('../../domain/services');

/**
 * Caso de uso: Activar una carta guardada
 */
class ActivateCard {
  constructor(gameRepository) {
    this.gameRepository = gameRepository;
  }

  /**
   * Ejecuta el caso de uso
   * @param {Object} params parámetros del caso de uso
   * @param {string} params.gameCode código de la partida
   * @param {string} params.playerId ID del jugador
   * @param {string} params.cardId ID de la carta a activar
   * @param {string} params.cardType tipo de carta (brinco, movement, venganza)
   * @param {string} params.targetPlayerId ID del jugador objetivo (solo para venganza)
   * @returns {Promise<Object>} resultado del caso de uso
   */
  async execute({ gameCode, playerId, cardId, cardType, targetPlayerId = null }) {
    try {
      // Validar parámetros
      if (!gameCode || typeof gameCode !== 'string') {
        throw new Error('El código de partida es requerido');
      }

      if (!playerId || typeof playerId !== 'string') {
        throw new Error('El ID del jugador es requerido');
      }

      if (!cardId || typeof cardId !== 'string') {
        throw new Error('El ID de la carta es requerido');
      }

      if (!cardType || !['brinco', 'movement', 'venganza'].includes(cardType)) {
        throw new Error('Tipo de carta inválido');
      }

      // Buscar la partida
      const game = await this.gameRepository.findByCode(gameCode);
      if (!game) {
        throw new Error('Partida no encontrada');
      }

      // Validar que el jugador esté en la partida
      if (!game.players.includes(playerId)) {
        throw new Error('El jugador no está en la partida');
      }

      let result;
      let activationResult;

      switch (cardType) {
        case 'brinco':
          // Activar carta "Al brinco" (5)
          if (game.status !== 'started') {
            throw new Error('Solo se pueden activar cartas durante la partida');
          }
          
          activationResult = game.activateBrincoCard(playerId, cardId);
          result = {
            type: 'brinco',
            message: activationResult.message,
            instruction: '¡Todos salten! El último en saltar toma',
            countdown: '1, 2, 3 ¡AL BRINCO!'
          };
          break;

        case 'movement':
          // Activar carta "Al que se mueve" (9)
          if (game.status !== 'started') {
            throw new Error('Solo se pueden activar cartas durante la partida');
          }
          
          activationResult = game.activateMoveCard(playerId, cardId);
          result = {
            type: 'movement',
            message: activationResult.message,
            instruction: 'Quédense inmóviles. El que se mueva toma',
            countdown: '1, 2, 3 ¡AL QUE SE MUEVE!',
            activatorCanMove: true
          };
          break;

        case 'venganza':
          // Activar carta de venganza (A)
          if (game.status !== 'ended') {
            throw new Error('La venganza solo se puede usar al final del juego');
          }

          if (!targetPlayerId) {
            throw new Error('Se requiere un jugador objetivo para la venganza');
          }

          activationResult = game.useVenganza(playerId, targetPlayerId);
          result = {
            type: 'venganza',
            message: activationResult.message,
            targetPlayer: targetPlayerId,
            instruction: `${playerId} usa venganza contra ${targetPlayerId}`
          };
          break;
      }

      // Guardar los cambios
      const updatedGame = await this.gameRepository.save(game);

      return {
        success: true,
        data: {
          activation: result,
          card: activationResult.card,
          game: GameService.getGameSummary(updatedGame, playerId),
          timestamp: new Date()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'ACTIVATE_CARD_ERROR'
        }
      };
    }
  }

  /**
   * Obtiene las cartas que un jugador puede activar
   * @param {Object} params parámetros
   * @param {string} params.gameCode código de la partida
   * @param {string} params.playerId ID del jugador
   * @returns {Promise<Object>} cartas activables
   */
  async getActivableCards({ gameCode, playerId }) {
    try {
      const game = await this.gameRepository.findByCode(gameCode);
      if (!game) {
        throw new Error('Partida no encontrada');
      }

      const savedCards = game.savedCards[playerId] || [];
      const venganzaCards = game.venganzaCards.filter(v => v.playerId === playerId);

      const activableCards = {
        savedCards: savedCards.map(card => ({
          ...card,
          canActivate: game.status === 'started' && ['5', '9'].includes(card.rank),
          type: card.rank === '5' ? 'brinco' : 'movement'
        })),
        venganzaCards: venganzaCards.map(v => ({
          ...v.card,
          canActivate: game.status === 'ended',
          type: 'venganza'
        }))
      };

      return {
        success: true,
        data: activableCards
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'GET_ACTIVABLE_CARDS_ERROR'
        }
      };
    }
  }
}

module.exports = ActivateCard;
