/**
 * Middlewares para validaciones y manejo de errores
 */

/**
 * Middleware para validar parámetros requeridos en el body
 * @param {string[]} requiredFields campos requeridos
 * @returns {Function} middleware
 */
function validateRequired(requiredFields) {
  return (req, res, next) => {
    const missing = requiredFields.filter(field => !req.body[field]);
    
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Campos requeridos faltantes: ${missing.join(', ')}`,
          code: 'MISSING_REQUIRED_FIELDS',
          fields: missing
        }
      });
    }
    
    next();
  };
}

/**
 * Middleware para validar formato de código de partida
 * @param {Object} req request
 * @param {Object} res response
 * @param {Function} next next function
 */
function validateGameCode(req, res, next) {
  const { code } = req.params;
  
  if (!code || typeof code !== 'string' || code.length < 4 || code.length > 10) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Código de partida inválido',
        code: 'INVALID_GAME_CODE'
      }
    });
  }
  
  next();
}

/**
 * Middleware para validar ID de jugador
 * @param {Object} req request
 * @param {Object} res response
 * @param {Function} next next function
 */
function validatePlayerId(req, res, next) {
  const playerId = req.body.playerId || req.params.playerId;
  
  if (!playerId || typeof playerId !== 'string' || playerId.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'ID de jugador inválido',
        code: 'INVALID_PLAYER_ID'
      }
    });
  }
  
  next();
}

/**
 * Middleware para validar tipo de carta en activación
 * @param {Object} req request
 * @param {Object} res response
 * @param {Function} next next function
 */
function validateCardType(req, res, next) {
  const { cardType } = req.body;
  const validTypes = ['brinco', 'movement', 'venganza'];
  
  if (!cardType || !validTypes.includes(cardType)) {
    return res.status(400).json({
      success: false,
      error: {
        message: `Tipo de carta inválido. Tipos válidos: ${validTypes.join(', ')}`,
        code: 'INVALID_CARD_TYPE'
      }
    });
  }
  
  next();
}

/**
 * Middleware para validar paginación
 * @param {Object} req request
 * @param {Object} res response
 * @param {Function} next next function
 */
function validatePagination(req, res, next) {
  const { limit = 50, offset = 0 } = req.query;
  
  const limitNum = parseInt(limit);
  const offsetNum = parseInt(offset);
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Límite debe ser un número entre 1 y 100',
        code: 'INVALID_LIMIT'
      }
    });
  }
  
  if (isNaN(offsetNum) || offsetNum < 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Offset debe ser un número mayor o igual a 0',
        code: 'INVALID_OFFSET'
      }
    });
  }
  
  req.query.limit = limitNum;
  req.query.offset = offsetNum;
  
  next();
}

/**
 * Middleware para logging de requests
 * @param {Object} req request
 * @param {Object} res response
 * @param {Function} next next function
 */
function logRequest(req, res, next) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;
  
  console.log(`[${timestamp}] ${method} ${url} - ${ip}`);
  
  next();
}

/**
 * Middleware para manejar errores generales
 * @param {Error} err error
 * @param {Object} req request
 * @param {Object} res response
 * @param {Function} next next function
 */
function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  // Error de validación de JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'JSON inválido',
        code: 'INVALID_JSON'
      }
    });
  }
  
  // Error genérico
  res.status(500).json({
    success: false,
    error: {
      message: 'Error interno del servidor',
      code: 'INTERNAL_SERVER_ERROR'
    }
  });
}

/**
 * Middleware para validar que la venganza requiere targetPlayerId
 * @param {Object} req request
 * @param {Object} res response
 * @param {Function} next next function
 */
function validateVenganza(req, res, next) {
  const { cardType, targetPlayerId } = req.body;
  
  if (cardType === 'venganza' && !targetPlayerId) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'La venganza requiere un jugador objetivo',
        code: 'MISSING_TARGET_PLAYER'
      }
    });
  }
  
  next();
}

/**
 * Middleware para validar reglas en actualización
 * @param {Object} req request
 * @param {Object} res response
 * @param {Function} next next function
 */
function validateRules(req, res, next) {
  const { rules } = req.body;
  
  if (!rules || typeof rules !== 'object') {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Las reglas deben ser un objeto',
        code: 'INVALID_RULES_FORMAT'
      }
    });
  }
  
  const validRanks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const invalidRanks = Object.keys(rules).filter(rank => !validRanks.includes(rank));
  
  if (invalidRanks.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: `Cartas inválidas en las reglas: ${invalidRanks.join(', ')}`,
        code: 'INVALID_CARD_RANKS'
      }
    });
  }
  
  next();
}

module.exports = {
  validateRequired,
  validateGameCode,
  validatePlayerId,
  validateCardType,
  validatePagination,
  validateVenganza,
  validateRules,
  logRequest,
  errorHandler
};
