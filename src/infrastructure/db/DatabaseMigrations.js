const GameModel = require('./GameModel');

/**
 * Utilidades para migraciones y mantenimiento de la base de datos
 */
class DatabaseMigrations {
  
  /**
   * Ejecutar todas las migraciones pendientes
   * @returns {Promise<void>}
   */
  async runMigrations() {
    try {
      console.log('🚀 Ejecutando migraciones...');
      
      await this.migration001_createInitialIndexes();
      await this.migration002_cleanupOldData();
      await this.migration003_updateGameStructure();
      
      console.log('✅ Migraciones completadas');
      
    } catch (error) {
      console.error('❌ Error en migraciones:', error.message);
      throw new Error(`Error en migraciones: ${error.message}`);
    }
  }

  /**
   * Migración 001: Crear índices iniciales
   * @returns {Promise<void>}
   */
  async migration001_createInitialIndexes() {
    try {
      console.log('📊 Migración 001: Creando índices iniciales...');
      
      const collection = GameModel.collection;
      
      // Índices únicos
      await collection.createIndex({ code: 1 }, { unique: true, background: true });
      
      // Índices de consulta
      await collection.createIndex({ status: 1 }, { background: true });
      await collection.createIndex({ players: 1 }, { background: true });
      await collection.createIndex({ createdAt: -1 }, { background: true });
      await collection.createIndex({ host: 1 }, { background: true });
      
      // Índices compuestos
      await collection.createIndex({ code: 1, status: 1 }, { background: true });
      await collection.createIndex({ players: 1, status: 1 }, { background: true });
      await collection.createIndex({ createdAt: -1, status: 1 }, { background: true });
      await collection.createIndex({ host: 1, status: 1 }, { background: true });
      
      console.log('✅ Índices creados exitosamente');
      
    } catch (error) {
      if (error.code === 85) {
        console.log('⚠️  Algunos índices ya existían, continuando...');
      } else {
        throw error;
      }
    }
  }

  /**
   * Migración 002: Limpiar datos antiguos
   * @returns {Promise<void>}
   */
  async migration002_cleanupOldData() {
    try {
      console.log('🧹 Migración 002: Limpiando datos antiguos...');
      
      // Eliminar partidas terminadas más antiguas a 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const result = await GameModel.deleteMany({
        status: 'ended',
        endedAt: { $lt: thirtyDaysAgo }
      });
      
      console.log(`🗑️  ${result.deletedCount} partidas antiguas eliminadas`);
      
      // Eliminar partidas en espera más antiguas a 7 días
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const waitingResult = await GameModel.deleteMany({
        status: 'waiting',
        createdAt: { $lt: sevenDaysAgo }
      });
      
      console.log(`⏰ ${waitingResult.deletedCount} partidas en espera antiguas eliminadas`);
      
    } catch (error) {
      console.error('❌ Error en limpieza:', error.message);
      throw error;
    }
  }

  /**
   * Migración 003: Actualizar estructura de juegos
   * @returns {Promise<void>}
   */
  async migration003_updateGameStructure() {
    try {
      console.log('🔄 Migración 003: Actualizando estructura de juegos...');
      
      // Actualizar juegos que no tienen campos nuevos
      const updateResult = await GameModel.updateMany(
        { kingsCount: { $exists: false } },
        { $set: { kingsCount: 0, cupContent: [], venganzaCards: [] } }
      );
      
      console.log(`📝 ${updateResult.modifiedCount} juegos actualizados`);
      
      // Actualizar juegos sin savedCards
      const savedCardsResult = await GameModel.updateMany(
        { savedCards: { $exists: false } },
        { $set: { savedCards: {} } }
      );
      
      console.log(`💾 ${savedCardsResult.modifiedCount} juegos con savedCards actualizados`);
      
    } catch (error) {
      console.error('❌ Error en actualización de estructura:', error.message);
      throw error;
    }
  }

  /**
   * Rollback de migración 003
   * @returns {Promise<void>}
   */
  async rollback003_revertGameStructure() {
    try {
      console.log('↩️  Rollback 003: Revirtiendo estructura de juegos...');
      
      const result = await GameModel.updateMany(
        {},
        { $unset: { kingsCount: "", cupContent: "", venganzaCards: "" } }
      );
      
      console.log(`🔄 ${result.modifiedCount} juegos revertidos`);
      
    } catch (error) {
      console.error('❌ Error en rollback:', error.message);
      throw error;
    }
  }

  /**
   * Validar integridad de los datos
   * @returns {Promise<Object>} Reporte de validación
   */
  async validateDataIntegrity() {
    try {
      console.log('🔍 Validando integridad de datos...');
      
      const issues = [];
      
      // 1. Verificar juegos sin host en players
      const gamesWithoutHost = await GameModel.countDocuments({
        $expr: { $not: { $in: ['$host', '$players'] } }
      });
      
      if (gamesWithoutHost > 0) {
        issues.push(`${gamesWithoutHost} juegos donde el host no está en players`);
      }
      
      // 2. Verificar juegos con jugadores duplicados
      const gamesWithDuplicates = await GameModel.aggregate([
        {
          $project: {
            code: 1,
            players: 1,
            uniquePlayers: { $size: { $setUnion: ['$players', []] } },
            totalPlayers: { $size: '$players' }
          }
        },
        {
          $match: {
            $expr: { $ne: ['$uniquePlayers', '$totalPlayers'] }
          }
        }
      ]);
      
      if (gamesWithDuplicates.length > 0) {
        issues.push(`${gamesWithDuplicates.length} juegos con jugadores duplicados`);
      }
      
      // 3. Verificar juegos con turnos inválidos
      const gamesWithInvalidTurns = await GameModel.countDocuments({
        $expr: { $gte: ['$currentTurn', { $size: '$players' }] }
      });
      
      if (gamesWithInvalidTurns > 0) {
        issues.push(`${gamesWithInvalidTurns} juegos con turnos inválidos`);
      }
      
      // 4. Verificar juegos con más de 8 jugadores
      const gamesWithTooManyPlayers = await GameModel.countDocuments({
        $expr: { $gt: [{ $size: '$players' }, 8] }
      });
      
      if (gamesWithTooManyPlayers > 0) {
        issues.push(`${gamesWithTooManyPlayers} juegos con más de 8 jugadores`);
      }
      
      const report = {
        isValid: issues.length === 0,
        issues: issues,
        timestamp: new Date().toISOString()
      };
      
      if (report.isValid) {
        console.log('✅ Validación exitosa: No se encontraron problemas');
      } else {
        console.log('⚠️  Problemas encontrados:', issues);
      }
      
      return report;
      
    } catch (error) {
      console.error('❌ Error en validación:', error.message);
      throw error;
    }
  }

  /**
   * Reparar problemas de integridad
   * @returns {Promise<Object>} Reporte de reparación
   */
  async repairDataIntegrity() {
    try {
      console.log('🔧 Reparando problemas de integridad...');
      
      const repairs = [];
      
      // 1. Reparar juegos sin host en players
      const hostRepair = await GameModel.updateMany(
        { $expr: { $not: { $in: ['$host', '$players'] } } },
        { $push: { players: '$host' } }
      );
      
      if (hostRepair.modifiedCount > 0) {
        repairs.push(`${hostRepair.modifiedCount} juegos: host agregado a players`);
      }
      
      // 2. Reparar turnos inválidos
      const turnRepair = await GameModel.updateMany(
        { $expr: { $gte: ['$currentTurn', { $size: '$players' }] } },
        { $set: { currentTurn: 0 } }
      );
      
      if (turnRepair.modifiedCount > 0) {
        repairs.push(`${turnRepair.modifiedCount} juegos: turnos reparados`);
      }
      
      // 3. Eliminar juegos con más de 8 jugadores
      const deleteResult = await GameModel.deleteMany({
        $expr: { $gt: [{ $size: '$players' }, 8] }
      });
      
      if (deleteResult.deletedCount > 0) {
        repairs.push(`${deleteResult.deletedCount} juegos eliminados (más de 8 jugadores)`);
      }
      
      const report = {
        repairCount: repairs.length,
        repairs: repairs,
        timestamp: new Date().toISOString()
      };
      
      if (report.repairCount > 0) {
        console.log('🔧 Reparaciones completadas:', repairs);
      } else {
        console.log('✅ No se necesitaron reparaciones');
      }
      
      return report;
      
    } catch (error) {
      console.error('❌ Error en reparación:', error.message);
      throw error;
    }
  }
}

module.exports = new DatabaseMigrations();
