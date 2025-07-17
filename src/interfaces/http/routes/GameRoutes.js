const express = require('express');
const {
  validateRequired,
  validateGameCode,
  validatePlayerId,
  validateCardType,
  validatePagination,
  validateVenganza,
  validateRules,
  logRequest,
  errorHandler
} = require('../middlewares/validations');

/**
 * Configura las rutas HTTP para las partidas
 * @param {Object} gameController controlador de partidas
 * @returns {express.Router} router configurado
 */
function createGameRoutes(gameController) {
  const router = express.Router();

  // Middleware global
  router.use(express.json());
  router.use(logRequest);

  // Rutas principales de partidas
  
  // Crear una nueva partida
  router.post('/', 
    validateRequired(['hostId']),
    validatePlayerId,
    (req, res) => gameController.create(req, res)
  );

  // Obtener estado de una partida
  router.get('/:code', 
    validateGameCode,
    (req, res) => gameController.getState(req, res)
  );

  // Unirse a una partida
  router.post('/:code/join', 
    validateGameCode,
    validateRequired(['playerId']),
    validatePlayerId,
    (req, res) => gameController.join(req, res)
  );

  // Iniciar una partida
  router.post('/:code/start', 
    validateGameCode,
    validateRequired(['playerId']),
    validatePlayerId,
    (req, res) => gameController.start(req, res)
  );

  // Robar una carta
  router.post('/:code/draw', 
    validateGameCode,
    validateRequired(['playerId']),
    validatePlayerId,
    (req, res) => gameController.draw(req, res)
  );

  // Activar una carta guardada
  router.post('/:code/activate', 
    validateGameCode,
    validateRequired(['playerId', 'cardId', 'cardType']),
    validatePlayerId,
    validateCardType,
    validateVenganza,
    (req, res) => gameController.activate(req, res)
  );

  // Obtener cartas activables de un jugador
  router.get('/:code/activable/:playerId', 
    validateGameCode,
    (req, res) => gameController.getActivableCards(req, res)
  );

  // Terminar una partida
  router.post('/:code/end', 
    validateGameCode,
    validateRequired(['playerId']),
    validatePlayerId,
    (req, res) => gameController.end(req, res)
  );

  // Obtener historial de una partida
  router.get('/:code/history', 
    validateGameCode,
    validatePagination,
    (req, res) => gameController.getHistory(req, res)
  );

  // Obtener estadísticas de una partida
  router.get('/:code/stats', 
    validateGameCode,
    (req, res) => gameController.getStats(req, res)
  );

  // Actualizar reglas de una partida
  router.patch('/:code/rules', 
    validateGameCode,
    validateRequired(['playerId', 'rules']),
    validatePlayerId,
    validateRules,
    (req, res) => gameController.updateRules(req, res)
  );

  // Obtener reglas de una partida
  router.get('/:code/rules', 
    validateGameCode,
    (req, res) => gameController.getRules(req, res)
  );

  // Restablecer reglas a las por defecto
  router.post('/:code/rules/reset', 
    validateGameCode,
    validateRequired(['playerId']),
    validatePlayerId,
    (req, res) => gameController.resetRules(req, res)
  );

  // Obtener resumen final de una partida terminada
  router.get('/:code/final-summary', 
    validateGameCode,
    (req, res) => gameController.getFinalSummary(req, res)
  );

  // Middleware para manejar rutas no encontradas
  router.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        message: 'Ruta no encontrada',
        code: 'ROUTE_NOT_FOUND'
      }
    });
  });

  // Middleware de manejo de errores
  router.use(errorHandler);

  return router;
}

module.exports = createGameRoutes;
