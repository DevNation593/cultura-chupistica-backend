/**
 * Configuración de entorno para la base de datos
 */

/**
 * Obtener configuración de MongoDB desde variables de entorno
 * @returns {Object} Configuración de MongoDB
 */
function getMongoConfig() {
  const config = {
    // URI de conexión
    uri: process.env.MONGODB_URI || 
         process.env.MONGO_URI || 
         'mongodb://localhost:27017/cultura-chupistica',
    
    // Configuración de conexión
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE) || 10,
      serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT) || 5000,
      socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT) || 45000,
      connectTimeoutMS: parseInt(process.env.MONGO_CONNECT_TIMEOUT) || 10000,
      maxIdleTimeMS: parseInt(process.env.MONGO_MAX_IDLE_TIME) || 30000,
      
      // Configuración de buffers
      bufferMaxEntries: parseInt(process.env.MONGO_BUFFER_MAX_ENTRIES) || 0,
      bufferCommands: process.env.MONGO_BUFFER_COMMANDS === 'true' || false,
      
      // Configuración de índices
      autoIndex: process.env.NODE_ENV !== 'production',
      
      // Configuración de escritura
      writeConcern: {
        w: process.env.MONGO_WRITE_CONCERN || 'majority',
        j: process.env.MONGO_JOURNAL === 'true' || true,
        wtimeout: parseInt(process.env.MONGO_WRITE_TIMEOUT) || 5000
      },
      
      // Configuración de lectura
      readPreference: process.env.MONGO_READ_PREFERENCE || 'primaryPreferred',
      readConcern: {
        level: process.env.MONGO_READ_CONCERN || 'local'
      }
    },
    
    // Configuración de la aplicación
    app: {
      database: process.env.MONGO_DATABASE || 'cultura-chupistica',
      collection: process.env.MONGO_COLLECTION || 'games',
      runMigrations: process.env.RUN_MIGRATIONS !== 'false',
      validateIntegrity: process.env.VALIDATE_INTEGRITY === 'true',
      autoRepair: process.env.AUTO_REPAIR === 'true',
      cleanupIntervalHours: parseInt(process.env.CLEANUP_INTERVAL_HOURS) || 24,
      oldGamesDays: parseInt(process.env.OLD_GAMES_DAYS) || 7
    }
  };
  
  return config;
}

/**
 * Validar configuración de MongoDB
 * @param {Object} config - Configuración a validar
 * @returns {Object} Resultado de validación
 */
function validateMongoConfig(config) {
  const errors = [];
  const warnings = [];
  
  // Validar URI
  if (!config.uri) {
    errors.push('URI de MongoDB no está definida');
  } else if (!config.uri.startsWith('mongodb://') && !config.uri.startsWith('mongodb+srv://')) {
    errors.push('URI de MongoDB no tiene formato válido');
  }
  
  // Validar configuración de pool
  if (config.options.maxPoolSize < 1 || config.options.maxPoolSize > 100) {
    warnings.push('maxPoolSize debería estar entre 1 y 100');
  }
  
  // Validar timeouts
  if (config.options.serverSelectionTimeoutMS < 1000) {
    warnings.push('serverSelectionTimeoutMS muy bajo, puede causar problemas de conexión');
  }
  
  if (config.options.socketTimeoutMS < 5000) {
    warnings.push('socketTimeoutMS muy bajo, puede causar timeouts prematuros');
  }
  
  // Validar configuración de aplicación
  if (config.app.cleanupIntervalHours < 1 || config.app.cleanupIntervalHours > 168) {
    warnings.push('cleanupIntervalHours debería estar entre 1 y 168 horas');
  }
  
  if (config.app.oldGamesDays < 1 || config.app.oldGamesDays > 365) {
    warnings.push('oldGamesDays debería estar entre 1 y 365 días');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Obtener configuración para diferentes entornos
 * @param {string} env - Entorno (development, test, production)
 * @returns {Object} Configuración específica del entorno
 */
function getEnvironmentConfig(env = process.env.NODE_ENV || 'development') {
  const baseConfig = getMongoConfig();
  
  switch (env) {
    case 'development':
      return {
        ...baseConfig,
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cultura-chupistica-dev',
        options: {
          ...baseConfig.options,
          autoIndex: true,
          debug: true
        },
        app: {
          ...baseConfig.app,
          runMigrations: true,
          validateIntegrity: true,
          autoRepair: true,
          cleanupIntervalHours: 1,
          oldGamesDays: 1
        }
      };
      
    case 'test':
      return {
        ...baseConfig,
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cultura-chupistica-test',
        options: {
          ...baseConfig.options,
          autoIndex: true,
          maxPoolSize: 5,
          serverSelectionTimeoutMS: 2000,
          socketTimeoutMS: 10000
        },
        app: {
          ...baseConfig.app,
          runMigrations: false,
          validateIntegrity: false,
          autoRepair: false,
          cleanupIntervalHours: 0.1,
          oldGamesDays: 0.1
        }
      };
      
    case 'production':
      return {
        ...baseConfig,
        options: {
          ...baseConfig.options,
          autoIndex: false,
          maxPoolSize: 20,
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 60000
        },
        app: {
          ...baseConfig.app,
          runMigrations: false,
          validateIntegrity: false,
          autoRepair: false,
          cleanupIntervalHours: 24,
          oldGamesDays: 30
        }
      };
      
    default:
      return baseConfig;
  }
}

/**
 * Mostrar configuración actual (sin información sensible)
 * @param {Object} config - Configuración a mostrar
 */
function logConfigInfo(config) {
  const safeConfig = {
    ...config,
    uri: config.uri.replace(/:[^:@]*@/, ':****@') // Ocultar password
  };
  
  console.log('📋 Configuración de MongoDB:');
  console.log('  - Entorno:', process.env.NODE_ENV || 'development');
  console.log('  - Base de datos:', config.app.database);
  console.log('  - Colección:', config.app.collection);
  console.log('  - Pool máximo:', config.options.maxPoolSize);
  console.log('  - Timeout de selección:', config.options.serverSelectionTimeoutMS + 'ms');
  console.log('  - Timeout de socket:', config.options.socketTimeoutMS + 'ms');
  console.log('  - Auto-índices:', config.options.autoIndex ? 'Habilitado' : 'Deshabilitado');
  console.log('  - Migraciones:', config.app.runMigrations ? 'Habilitadas' : 'Deshabilitadas');
  console.log('  - Limpieza cada:', config.app.cleanupIntervalHours + 'h');
  console.log('  - Juegos antiguos:', config.app.oldGamesDays + ' días');
}

module.exports = {
  getMongoConfig,
  validateMongoConfig,
  getEnvironmentConfig,
  logConfigInfo
};
