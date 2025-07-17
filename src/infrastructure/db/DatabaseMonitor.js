const GameModel = require('./GameModel');
const DatabaseConfig = require('./DatabaseConfig');

/**
 * Sistema de monitoreo para la base de datos
 */
class DatabaseMonitor {
  constructor() {
    this.metrics = {
      queries: 0,
      errors: 0,
      slowQueries: 0,
      connections: 0,
      lastCleanup: null,
      uptime: Date.now()
    };
    
    this.slowQueryThreshold = 1000; // 1 segundo
    this.cleanupInterval = null;
    this.isMonitoring = false;
  }

  /**
   * Iniciar monitoreo
   * @param {Object} options - Opciones de monitoreo
   */
  startMonitoring(options = {}) {
    if (this.isMonitoring) {
      console.log('⚠️  El monitoreo ya está activo');
      return;
    }

    this.isMonitoring = true;
    this.slowQueryThreshold = options.slowQueryThreshold || 1000;
    
    console.log('📊 Iniciando monitoreo de base de datos...');
    
    // Configurar limpieza automática
    if (options.autoCleanup !== false) {
      this.setupAutoCleanup(options.cleanupIntervalHours || 24);
    }
    
    // Configurar métricas de mongoose
    this.setupMongooseMetrics();
    
    // Configurar reporte periódico
    if (options.reportInterval) {
      this.setupPeriodicReport(options.reportInterval);
    }
    
    console.log('✅ Monitoreo de base de datos iniciado');
  }

  /**
   * Detener monitoreo
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      console.log('⚠️  El monitoreo no está activo');
      return;
    }

    this.isMonitoring = false;
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = null;
    }
    
    console.log('🛑 Monitoreo de base de datos detenido');
  }

  /**
   * Configurar limpieza automática
   * @param {number} intervalHours - Intervalo en horas
   */
  setupAutoCleanup(intervalHours) {
    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    this.cleanupInterval = setInterval(async () => {
      try {
        console.log('🧹 Ejecutando limpieza automática...');
        await this.performCleanup();
        this.metrics.lastCleanup = new Date();
        console.log('✅ Limpieza automática completada');
      } catch (error) {
        console.error('❌ Error en limpieza automática:', error.message);
        this.metrics.errors++;
      }
    }, intervalMs);
    
    console.log(`⏰ Limpieza automática configurada cada ${intervalHours}h`);
  }

  /**
   * Configurar métricas de mongoose
   */
  setupMongooseMetrics() {
    const mongoose = require('mongoose');
    
    // Interceptar consultas para métricas
    mongoose.set('debug', (collection, method, query, doc, options) => {
      this.metrics.queries++;
      
      const startTime = Date.now();
      
      // Simular medición de tiempo (en producción usarías un interceptor más sofisticado)
      setTimeout(() => {
        const duration = Date.now() - startTime;
        if (duration > this.slowQueryThreshold) {
          this.metrics.slowQueries++;
          console.warn(`🐌 Consulta lenta detectada: ${method} en ${collection} (${duration}ms)`);
        }
      }, 0);
    });
  }

  /**
   * Configurar reporte periódico
   * @param {number} intervalMinutes - Intervalo en minutos
   */
  setupPeriodicReport(intervalMinutes) {
    const intervalMs = intervalMinutes * 60 * 1000;
    
    this.reportInterval = setInterval(async () => {
      try {
        const report = await this.generateReport();
        console.log('📊 Reporte periódico de base de datos:', report);
      } catch (error) {
        console.error('❌ Error generando reporte:', error.message);
      }
    }, intervalMs);
  }

  /**
   * Realizar limpieza de base de datos
   * @param {Object} options - Opciones de limpieza
   * @returns {Promise<Object>} Resultado de limpieza
   */
  async performCleanup(options = {}) {
    try {
      const daysOld = options.daysOld || 7;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      // Eliminar partidas terminadas antiguas
      const endedGames = await GameModel.deleteMany({
        status: 'ended',
        endedAt: { $lt: cutoffDate }
      });
      
      // Eliminar partidas en espera muy antiguas
      const waitingCutoff = new Date();
      waitingCutoff.setDate(waitingCutoff.getDate() - 1);
      
      const abandonedGames = await GameModel.deleteMany({
        status: 'waiting',
        createdAt: { $lt: waitingCutoff }
      });
      
      const result = {
        endedGamesDeleted: endedGames.deletedCount,
        abandonedGamesDeleted: abandonedGames.deletedCount,
        totalDeleted: endedGames.deletedCount + abandonedGames.deletedCount,
        timestamp: new Date()
      };
      
      console.log(`🧹 Limpieza completada: ${result.totalDeleted} partidas eliminadas`);
      return result;
      
    } catch (error) {
      console.error('❌ Error en limpieza:', error.message);
      this.metrics.errors++;
      throw error;
    }
  }

  /**
   * Generar reporte de estado
   * @returns {Promise<Object>} Reporte completo
   */
  async generateReport() {
    try {
      const connectionInfo = DatabaseConfig.getConnectionInfo();
      const dbStats = await DatabaseConfig.getDatabaseStats();
      
      // Estadísticas de juegos
      const gameStats = await this.getGameStatistics();
      
      // Métricas de rendimiento
      const performanceMetrics = await this.getPerformanceMetrics();
      
      return {
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - this.metrics.uptime) / 1000),
        connection: connectionInfo,
        database: dbStats,
        games: gameStats,
        performance: performanceMetrics,
        monitoring: {
          isActive: this.isMonitoring,
          lastCleanup: this.metrics.lastCleanup,
          totalQueries: this.metrics.queries,
          totalErrors: this.metrics.errors,
          slowQueries: this.metrics.slowQueries
        }
      };
      
    } catch (error) {
      console.error('❌ Error generando reporte:', error.message);
      this.metrics.errors++;
      throw error;
    }
  }

  /**
   * Obtener estadísticas de juegos
   * @returns {Promise<Object>} Estadísticas de juegos
   */
  async getGameStatistics() {
    try {
      const [
        totalGames,
        activeGames,
        waitingGames,
        startedGames,
        endedGames,
        recentGames
      ] = await Promise.all([
        GameModel.countDocuments(),
        GameModel.countDocuments({ status: { $in: ['waiting', 'started'] } }),
        GameModel.countDocuments({ status: 'waiting' }),
        GameModel.countDocuments({ status: 'started' }),
        GameModel.countDocuments({ status: 'ended' }),
        GameModel.countDocuments({ 
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        })
      ]);
      
      // Distribución de jugadores
      const playerDistribution = await GameModel.aggregate([
        {
          $group: {
            _id: { $size: '$players' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      
      return {
        total: totalGames,
        active: activeGames,
        waiting: waitingGames,
        started: startedGames,
        ended: endedGames,
        recent24h: recentGames,
        playerDistribution: playerDistribution.reduce((acc, item) => {
          acc[`${item._id}players`] = item.count;
          return acc;
        }, {})
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de juegos:', error.message);
      throw error;
    }
  }

  /**
   * Obtener métricas de rendimiento
   * @returns {Promise<Object>} Métricas de rendimiento
   */
  async getPerformanceMetrics() {
    try {
      const mongoose = require('mongoose');
      const connections = mongoose.connections.length;
      const readyState = mongoose.connection.readyState;
      
      return {
        connections,
        readyState,
        queries: this.metrics.queries,
        errors: this.metrics.errors,
        slowQueries: this.metrics.slowQueries,
        slowQueryThreshold: this.slowQueryThreshold,
        errorRate: this.metrics.queries > 0 ? (this.metrics.errors / this.metrics.queries) * 100 : 0,
        slowQueryRate: this.metrics.queries > 0 ? (this.metrics.slowQueries / this.metrics.queries) * 100 : 0
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo métricas de rendimiento:', error.message);
      throw error;
    }
  }

  /**
   * Obtener métricas actuales
   * @returns {Object} Métricas actuales
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.uptime,
      errorRate: this.metrics.queries > 0 ? (this.metrics.errors / this.metrics.queries) * 100 : 0,
      slowQueryRate: this.metrics.queries > 0 ? (this.metrics.slowQueries / this.metrics.queries) * 100 : 0
    };
  }

  /**
   * Reiniciar métricas
   */
  resetMetrics() {
    this.metrics = {
      queries: 0,
      errors: 0,
      slowQueries: 0,
      connections: 0,
      lastCleanup: this.metrics.lastCleanup,
      uptime: Date.now()
    };
    
    console.log('🔄 Métricas reiniciadas');
  }
}

// Exportar instancia singleton
const dbMonitor = new DatabaseMonitor();

module.exports = dbMonitor;
