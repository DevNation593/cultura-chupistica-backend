#!/usr/bin/env node

/**
 * Script para resetear la base de datos en desarrollo
 */

require('dotenv').config();
const DatabaseConfig = require('../src/infrastructure/db/DatabaseConfig');
const GameModel = require('../src/infrastructure/db/GameModel');

/**
 * Resetear base de datos
 */
async function resetDatabase() {
  console.log('🔧 Reseteando base de datos de desarrollo...');
  
  try {
    // Conectar a la base de datos
    await DatabaseConfig.connect();
    
    // Eliminar todos los juegos
    const deleteResult = await GameModel.deleteMany({});
    console.log(`✅ Eliminados ${deleteResult.deletedCount} juegos`);
    
    // Resetear contadores si existen
    await GameModel.collection.dropIndexes();
    console.log('✅ Índices eliminados');
    
    // Recrear índices
    await GameModel.createIndexes();
    console.log('✅ Índices recreados');
    
    console.log('✅ Base de datos reseteada correctamente');
    
  } catch (error) {
    console.error('❌ Error reseteando base de datos:', error);
    process.exit(1);
  } finally {
    await DatabaseConfig.disconnect();
    console.log('🔌 Desconectado de la base de datos');
  }
}

/**
 * Verificar entorno antes del reset
 */
function verifyEnvironment() {
  const environment = process.env.NODE_ENV || 'development';
  
  if (environment === 'production') {
    console.error('❌ No se puede resetear base de datos en producción');
    process.exit(1);
  }
  
  console.log(`✅ Entorno verificado: ${environment}`);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  verifyEnvironment();
  resetDatabase();
}

module.exports = { resetDatabase };
