/**
 * Configuración principal de la aplicación
 * Centraliza todas las configuraciones del sistema
 */

const config = {
  // Configuración del servidor
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    environment: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || '*'
  },

  // Configuración de la base de datos
  database: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/cultura_chupistica',
    name: process.env.MONGO_DB_NAME || 'cultura_chupistica',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE) || 10,
      serverSelectionTimeoutMS: parseInt(process.env.MONGO_TIMEOUT) || 5000,
      socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT) || 45000,
    }
  },

  // Configuración de logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    file: process.env.LOG_FILE || './logs/app.log',
    enableConsole: process.env.ENABLE_CONSOLE_LOG !== 'false',
    enableFile: process.env.ENABLE_FILE_LOG !== 'false'
  },

  // Configuración del juego
  game: {
    maxPlayersPerGame: parseInt(process.env.MAX_PLAYERS_PER_GAME) || 8,
    minPlayersToStart: parseInt(process.env.MIN_PLAYERS_TO_START) || 2,
    gameTimeoutMinutes: parseInt(process.env.GAME_TIMEOUT_MINUTES) || 30,
    cardDrawTimeoutSeconds: parseInt(process.env.CARD_DRAW_TIMEOUT_SECONDS) || 30,
    autoEndGameOnTimeout: process.env.AUTO_END_GAME_ON_TIMEOUT !== 'false'
  },

  // Configuración de WebSocket
  websocket: {
    corsOrigin: process.env.SOCKET_IO_CORS_ORIGIN || '*',
    pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT) || 60000,
    pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL) || 25000,
    maxConnections: parseInt(process.env.SOCKET_MAX_CONNECTIONS) || 1000
  },

  // Configuración de seguridad
  security: {
    jwtSecret: process.env.JWT_SECRET || 'default-secret-key',
    apiKey: process.env.API_KEY,
    enableRateLimit: process.env.ENABLE_RATE_LIMIT !== 'false',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutos
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100
  },

  // Configuración de desarrollo
  development: {
    enableSwagger: process.env.ENABLE_SWAGGER === 'true',
    enableDebug: process.env.DEBUG === 'true',
    enableMockData: process.env.ENABLE_MOCK_DATA === 'true',
    hotReload: process.env.HOT_RELOAD !== 'false'
  },

  // Configuración de producción
  production: {
    enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
    enableCaching: process.env.ENABLE_CACHING !== 'false',
    enableMetrics: process.env.ENABLE_METRICS !== 'false',
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000
  }
};

/**
 * Validar configuración crítica
 */
function validateConfig() {
  const errors = [];
  
  // Validar puerto
  if (!config.server.port || config.server.port < 1 || config.server.port > 65535) {
    errors.push('Puerto del servidor inválido');
  }
  
  // Validar URI de base de datos
  if (!config.database.uri) {
    errors.push('URI de base de datos no configurada');
  }
  
  // Validar configuración de juego
  if (config.game.maxPlayersPerGame < config.game.minPlayersToStart) {
    errors.push('Máximo de jugadores debe ser mayor que mínimo');
  }
  
  // Validar secretos en producción
  if (config.server.environment === 'production') {
    if (!config.security.jwtSecret || config.security.jwtSecret === 'default-secret-key') {
      errors.push('JWT secret debe ser configurado en producción');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Obtener configuración por entorno
 */
function getEnvironmentConfig() {
  const env = config.server.environment;
  
  const environmentConfigs = {
    development: {
      ...config,
      logging: { ...config.logging, level: 'debug' },
      development: { ...config.development, enableDebug: true }
    },
    
    production: {
      ...config,
      logging: { ...config.logging, level: 'warn' },
      production: { ...config.production, enableCompression: true }
    },
    
    test: {
      ...config,
      database: { ...config.database, name: 'cultura_chupistica_test' },
      logging: { ...config.logging, level: 'error' }
    }
  };
  
  return environmentConfigs[env] || config;
}

/**
 * Mostrar configuración actual
 */
function showConfig() {
  console.log('📋 Configuración actual:');
  console.log(`  🌍 Entorno: ${config.server.environment}`);
  console.log(`  🚀 Puerto: ${config.server.port}`);
  console.log(`  🗄️  Base de datos: ${config.database.name}`);
  console.log(`  📝 Log level: ${config.logging.level}`);
  console.log(`  🎮 Jugadores máx: ${config.game.maxPlayersPerGame}`);
  console.log(`  ⏰ Timeout juego: ${config.game.gameTimeoutMinutes}m`);
}

module.exports = {
  config,
  validateConfig,
  getEnvironmentConfig,
  showConfig
};
