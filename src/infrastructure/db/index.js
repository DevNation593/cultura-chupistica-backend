/**
 * Índice de la capa de infraestructura de base de datos
 * Exporta todos los componentes necesarios para la persistencia
 */

const DatabaseConfig = require('./DatabaseConfig');
const GameRepository = require('./GameRepository');
const GameModel = require('./GameModel');
const DatabaseMigrations = require('./DatabaseMigrations');
const DatabaseMonitor = require('./DatabaseMonitor');
const DatabaseEnv = require('./DatabaseEnv');

/**
 * Inicializar la base de datos con configuración
 * @param {string} mongoUri - URI de conexión a MongoDB
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Object>} Objeto con repositorio y configuración
 */
async function initializeDatabase(mongoUri, options = {}) {
  try {
    // Validar configuración
    const config = DatabaseEnv.getEnvironmentConfig();
    const validation = DatabaseEnv.validateMongoConfig(config);
    
    if (!validation.isValid) {
      throw new Error(`Configuración inválida: ${validation.errors.join(', ')}`);
    }
    
    if (validation.warnings.length > 0) {
      console.warn('⚠️  Advertencias de configuración:', validation.warnings);
    }
    
    // Mostrar información de configuración
    DatabaseEnv.logConfigInfo(config);
    
    // Conectar a MongoDB
    await DatabaseConfig.connect(mongoUri || config.uri);
    
    // Ejecutar migraciones si es necesario
    if (options.runMigrations !== false && config.app.runMigrations) {
      await DatabaseMigrations.runMigrations();
    }
    
    // Validar integridad de datos si es necesario
    if (options.validateIntegrity || config.app.validateIntegrity) {
      const validationReport = await DatabaseMigrations.validateDataIntegrity();
      if (!validationReport.isValid) {
        console.warn('⚠️  Problemas de integridad detectados:', validationReport.issues);
        
        if (options.autoRepair || config.app.autoRepair) {
          await DatabaseMigrations.repairDataIntegrity();
        }
      }
    }
    
    // Iniciar monitoreo si es necesario
    if (options.enableMonitoring !== false) {
      DatabaseMonitor.startMonitoring({
        autoCleanup: true,
        cleanupIntervalHours: config.app.cleanupIntervalHours,
        slowQueryThreshold: options.slowQueryThreshold || 1000,
        reportInterval: options.reportInterval
      });
    }
    
    // Crear instancia del repositorio
    const gameRepository = new GameRepository();
    
    console.log('✅ Base de datos inicializada correctamente');
    
    return {
      gameRepository,
      dbConfig: DatabaseConfig,
      model: GameModel,
      migrations: DatabaseMigrations,
      monitor: DatabaseMonitor,
      env: DatabaseEnv,
      config
    };
    
  } catch (error) {
    console.error('❌ Error al inicializar base de datos:', error.message);
    throw error;
  }
}

/**
 * Cerrar conexiones de base de datos
 * @returns {Promise<void>}
 */
async function closeDatabase() {
  try {
    // Detener monitoreo
    DatabaseMonitor.stopMonitoring();
    
    // Cerrar conexión
    await DatabaseConfig.disconnect();
    console.log('✅ Base de datos cerrada correctamente');
  } catch (error) {
    console.error('❌ Error al cerrar base de datos:', error.message);
    throw error;
  }
}

/**
 * Obtener estado de salud de la base de datos
 * @returns {Promise<Object>} Estado de salud
 */
async function getHealthStatus() {
  try {
    const isHealthy = await DatabaseConfig.healthCheck();
    const connectionInfo = DatabaseConfig.getConnectionInfo();
    const stats = await DatabaseConfig.getDatabaseStats();
    
    return {
      isHealthy,
      connection: connectionInfo,
      stats,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      isHealthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  // Componentes principales
  DatabaseConfig,
  GameRepository,
  GameModel,
  DatabaseMigrations,
  DatabaseMonitor,
  DatabaseEnv,
  
  // Funciones de utilidad
  initializeDatabase,
  closeDatabase,
  getHealthStatus
};
