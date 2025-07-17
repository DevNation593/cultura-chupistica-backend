/**
 * Índice de servicios de dominio
 * Exporta todos los servicios de dominio para facilitar su uso
 */

const CardService = require('./CardService');
const GameService = require('./GameService');
const GameEventService = require('./GameEventService');
const GameValidationService = require('./GameValidationService');
const GameStatsService = require('./GameStatsService');
const GameNotificationService = require('./GameNotificationService');

/**
 * Inicializar todos los servicios de dominio
 * @param {Object} config - Configuración opcional
 * @returns {Object} Servicios inicializados
 */
function initializeDomainServices(config = {}) {
  console.log('🎯 Inicializando servicios de dominio...');
  
  // Configurar servicios si es necesario
  const services = {
    cardService: CardService,
    gameService: GameService,
    eventService: GameEventService,
    validationService: GameValidationService,
    statsService: GameStatsService,
    notificationService: GameNotificationService
  };

  // Validar que todos los servicios estén disponibles
  for (const [serviceName, service] of Object.entries(services)) {
    if (!service) {
      throw new Error(`Servicio ${serviceName} no está disponible`);
    }
  }

  console.log('✅ Servicios de dominio inicializados');
  return services;
}

/**
 * Validar integridad de servicios de dominio
 * @returns {Object} Resultado de validación
 */
function validateDomainServices() {
  const validation = {
    isValid: true,
    errors: [],
    warnings: []
  };

  try {
    // Validar CardService
    const testDeck = CardService.createFullDeck();
    if (!CardService.isCompleteDeck(testDeck)) {
      validation.errors.push('CardService: No puede crear baraja completa');
    }

    // Validar GameService
    const testGame = GameService.createGame('test_host');
    if (!testGame || !testGame.code) {
      validation.errors.push('GameService: No puede crear juego');
    }

    // Validar GameEventService
    const testEvent = GameEventService.createEvent(
      GameEventService.EVENT_TYPES.GAME_CREATED,
      'TEST01',
      'player1'
    );
    if (!GameEventService.isValidEvent(testEvent)) {
      validation.errors.push('GameEventService: No puede crear evento válido');
    }

    // Validar GameValidationService
    const codeValidation = GameValidationService.validateGameCode('TEST01');
    if (!codeValidation.isValid) {
      validation.errors.push('GameValidationService: Validación de código falló');
    }

    // Validar GameStatsService
    const basicStats = GameStatsService.calculateBasicStats(testGame);
    if (!basicStats || !basicStats.gameCode) {
      validation.errors.push('GameStatsService: No puede calcular estadísticas básicas');
    }

    // Validar GameNotificationService
    const testNotification = GameNotificationService.createNotification(
      GameNotificationService.NOTIFICATION_TYPES.INFO,
      'Test message',
      'TEST01'
    );
    if (!GameNotificationService.isValidNotification(testNotification)) {
      validation.errors.push('GameNotificationService: No puede crear notificación válida');
    }

    validation.isValid = validation.errors.length === 0;
    
    if (validation.isValid) {
      console.log('✅ Validación de servicios de dominio exitosa');
    } else {
      console.error('❌ Errores en validación de servicios:', validation.errors);
    }

  } catch (error) {
    validation.isValid = false;
    validation.errors.push(`Error durante validación: ${error.message}`);
  }

  return validation;
}

/**
 * Crear pipeline de procesamiento de eventos
 * @param {Object} event - Evento a procesar
 * @returns {Object} Resultado del procesamiento
 */
function processEventPipeline(event) {
  const result = {
    success: false,
    event: null,
    notification: null,
    errors: []
  };

  try {
    // 1. Validar evento
    if (!GameEventService.isValidEvent(event)) {
      result.errors.push('Evento inválido');
      return result;
    }

    // 2. Procesar evento
    result.event = event;

    // 3. Crear notificación desde evento
    result.notification = GameNotificationService.createNotificationFromEvent(event);

    // 4. Validar notificación
    if (!GameNotificationService.isValidNotification(result.notification)) {
      result.errors.push('Notificación generada inválida');
      return result;
    }

    result.success = true;
    return result;

  } catch (error) {
    result.errors.push(`Error en pipeline: ${error.message}`);
    return result;
  }
}

/**
 * Utilidades para servicios de dominio
 */
const DomainUtils = {
  /**
   * Crear contexto de juego completo
   * @param {Object} game - Juego
   * @returns {Object} Contexto completo
   */
  createGameContext(game) {
    return {
      game,
      stats: GameStatsService.calculateDetailedStats(game),
      validation: GameValidationService.validateGameState(game),
      isValid: GameValidationService.validateGameState(game).isValid,
      progress: GameStatsService.calculateGameProgress(game),
      duration: GameStatsService.calculateGameDuration(game),
      nearEnd: GameStatsService.isGameNearEnd(game)
    };
  },

  /**
   * Crear contexto de jugador
   * @param {Object} game - Juego
   * @param {string} playerId - ID del jugador
   * @returns {Object} Contexto del jugador
   */
  createPlayerContext(game, playerId) {
    const playerStats = GameStatsService.calculatePlayerStats(game)
      .find(p => p.playerId === playerId);
    
    return {
      playerId,
      stats: playerStats,
      isCurrentTurn: game.players[game.currentTurn] === playerId,
      isHost: game.host === playerId,
      canDraw: GameValidationService.validateCardDraw(game, playerId).isValid,
      venganzas: game.venganzaCards.filter(v => v.playerId === playerId),
      savedCards: game.savedCards[playerId] || []
    };
  },

  /**
   * Crear resumen ejecutivo del juego
   * @param {Object} game - Juego
   * @returns {Object} Resumen ejecutivo
   */
  createExecutiveSummary(game) {
    const stats = GameStatsService.calculateBasicStats(game);
    const detailed = GameStatsService.calculateDetailedStats(game);
    
    return {
      gameCode: game.code,
      status: game.status,
      progress: stats.gameProgress,
      duration: stats.duration.formatted,
      players: detailed.players.map(p => ({
        id: p.playerId,
        isHost: p.isHost,
        cardsDrawn: p.cardsDrawn,
        venganzas: p.venganzasEarned,
        isCurrentTurn: p.isCurrentTurn
      })),
      highlights: {
        kingsDrawn: stats.kingsCount,
        gameNearEnd: stats.isGameNearEnd,
        totalVenganzas: stats.venganzasAvailable,
        cardsRemaining: stats.cardsRemaining
      }
    };
  }
};

module.exports = {
  // Servicios principales
  CardService,
  GameService,
  GameEventService,
  GameValidationService,
  GameStatsService,
  GameNotificationService,
  
  // Utilidades
  initializeDomainServices,
  validateDomainServices,
  processEventPipeline,
  DomainUtils
};
