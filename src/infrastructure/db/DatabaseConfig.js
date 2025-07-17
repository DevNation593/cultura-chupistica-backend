const mongoose = require('mongoose');

/**
 * Configuración de conexión a MongoDB
 */
class DatabaseConfig {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    
    // Configuración de conexión actualizada para MongoDB Atlas
    this.config = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      autoIndex: process.env.NODE_ENV !== 'production'
    };
    
    // Eventos de conexión
    this._setupConnectionEvents();
  }

  /**
   * Conectar a MongoDB
   * @param {string} uri - URI de conexión
   * @returns {Promise<void>}
   */
  async connect(uri) {
    try {
      if (this.isConnected) {
        console.log('Ya hay una conexión activa a MongoDB');
        return;
      }

      console.log('Conectando a MongoDB...');
      this.connection = await mongoose.connect(uri, this.config);
      this.isConnected = true;
      
      console.log('✅ Conexión exitosa a MongoDB');
      
      // Crear índices si no existen
      await this._createIndexes();
      
    } catch (error) {
      console.error('❌ Error al conectar a MongoDB:', error.message);
      throw new Error(`Error de conexión a MongoDB: ${error.message}`);
    }
  }

  /**
   * Desconectar de MongoDB
   * @returns {Promise<void>}
   */
  async disconnect() {
    try {
      if (!this.isConnected) {
        console.log('No hay conexión activa a MongoDB');
        return;
      }

      await mongoose.connection.close();
      this.isConnected = false;
      console.log('🔌 Desconectado de MongoDB');
      
    } catch (error) {
      console.error('❌ Error al desconectar de MongoDB:', error.message);
      throw new Error(`Error al desconectar de MongoDB: ${error.message}`);
    }
  }

  /**
   * Obtener estado de la conexión
   * @returns {string} Estado de la conexión
   */
  getConnectionState() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    return states[mongoose.connection.readyState] || 'unknown';
  }

  /**
   * Obtener información de la conexión
   * @returns {Object} Información de la conexión
   */
  getConnectionInfo() {
    return {
      state: this.getConnectionState(),
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      isConnected: this.isConnected
    };
  }

  /**
   * Verificar salud de la conexión
   * @returns {Promise<Object>} Objeto con información del estado de salud
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      
      if (!this.isConnected) {
        return {
          isHealthy: false,
          error: 'No hay conexión activa a MongoDB',
          responseTime: '0ms'
        };
      }

      // Hacer una operación simple para verificar la conexión
      await mongoose.connection.db.admin().ping();
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      return {
        isHealthy: true,
        responseTime: `${responseTime}ms`,
        connection: 'active',
        server: mongoose.connection.host
      };
      
    } catch (error) {
      console.error('❌ Health check falló:', error.message);
      return {
        isHealthy: false,
        error: error.message,
        responseTime: '0ms'
      };
    }
  }

  /**
   * Configurar eventos de conexión
   * @private
   */
  _setupConnectionEvents() {
    mongoose.connection.on('connected', () => {
      console.log('🔗 Mongoose conectado a MongoDB');
    });

    mongoose.connection.on('error', (error) => {
      console.error('❌ Error de conexión Mongoose:', error.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 Mongoose desconectado de MongoDB');
      this.isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 Mongoose reconectado a MongoDB');
      this.isConnected = true;
    });

    mongoose.connection.on('close', () => {
      console.log('📪 Conexión de Mongoose cerrada');
    });

    // Manejo de cierre graceful
    process.on('SIGINT', async () => {
      console.log('\n🛑 Cerrando conexión a MongoDB...');
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Cerrando conexión a MongoDB...');
      await this.disconnect();
      process.exit(0);
    });
  }

  /**
   * Crear índices necesarios
   * @private
   */
  async _createIndexes() {
    try {
      const GameModel = require('./GameModel');
      
      // Crear índices personalizados si no existen
      await GameModel.collection.createIndex({ code: 1 }, { unique: true });
      await GameModel.collection.createIndex({ status: 1 });
      await GameModel.collection.createIndex({ players: 1 });
      await GameModel.collection.createIndex({ createdAt: -1 });
      await GameModel.collection.createIndex({ code: 1, status: 1 });
      await GameModel.collection.createIndex({ players: 1, status: 1 });
      
      console.log('✅ Índices creados exitosamente');
      
    } catch (error) {
      console.error('❌ Error al crear índices:', error.message);
    }
  }

  /**
   * Obtener estadísticas de la base de datos
   * @returns {Promise<Object>} Estadísticas de la DB
   */
  async getDatabaseStats() {
    try {
      if (!this.isConnected) {
        throw new Error('No hay conexión a la base de datos');
      }

      const stats = await mongoose.connection.db.stats();
      const GameModel = require('./GameModel');
      const gameStats = await GameModel.getGlobalStats();

      return {
        database: {
          collections: stats.collections,
          dataSize: stats.dataSize,
          storageSize: stats.storageSize,
          indexes: stats.indexes,
          indexSize: stats.indexSize
        },
        games: gameStats,
        connection: this.getConnectionInfo()
      };
      
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error.message);
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Limpiar datos de prueba
   * @returns {Promise<void>}
   */
  async cleanupTestData() {
    try {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('No se puede limpiar datos en producción');
      }

      const GameModel = require('./GameModel');
      
      // Eliminar todas las partidas de prueba
      const result = await GameModel.deleteMany({
        code: { $regex: /^TEST_/ }
      });

      console.log(`🧹 Limpieza completada: ${result.deletedCount} partidas de prueba eliminadas`);
      
    } catch (error) {
      console.error('❌ Error al limpiar datos de prueba:', error.message);
      throw new Error(`Error al limpiar datos de prueba: ${error.message}`);
    }
  }
}

// Exportar instancia singleton
const dbConfig = new DatabaseConfig();

module.exports = dbConfig;
