#!/usr/bin/env node

/**
 * Script de inicio para desarrollo
 * Proporciona funcionalidades adicionales para el entorno de desarrollo
 */

const app = require('./src/app');
const DatabaseConfig = require('./src/infrastructure/db/DatabaseConfig');

/**
 * Configuración específica para desarrollo
 */
async function setupDevelopmentEnvironment() {
  console.log('🔧 Configurando entorno de desarrollo...');
  
  // Configurar variables de entorno para desarrollo
  process.env.NODE_ENV = 'development';
  process.env.LOG_LEVEL = 'debug';
  
  // Configurar base de datos para desarrollo
  if (!process.env.MONGO_URI) {
    process.env.MONGO_URI = 'mongodb://localhost:27017/cultura_chupistica_dev';
  }
  
  // Habilitar CORS para desarrollo
  process.env.CORS_ORIGIN = '*';
  
  console.log('✅ Entorno de desarrollo configurado');
}

/**
 * Verificar dependencias del sistema
 */
async function checkSystemDependencies() {
  console.log('🔧 Verificando dependencias del sistema...');
  
  try {
    // Verificar MongoDB
    const dbHealth = await DatabaseConfig.healthCheck();
    if (!dbHealth.isHealthy) {
      console.warn('⚠️  MongoDB no está disponible. Asegúrate de tener MongoDB ejecutándose.');
    }
    
    // Verificar Node.js version
    const nodeVersion = process.version;
    const requiredVersion = 'v14.0.0';
    
    if (nodeVersion < requiredVersion) {
      console.warn(`⚠️  Node.js ${nodeVersion} detectado. Se recomienda ${requiredVersion} o superior.`);
    }
    
    console.log('✅ Dependencias del sistema verificadas');
    
  } catch (error) {
    console.error('❌ Error verificando dependencias:', error.message);
    console.log('💡 Sugerencias:');
    console.log('  - Instala MongoDB: brew install mongodb-community');
    console.log('  - Inicia MongoDB: brew services start mongodb-community');
    console.log('  - Verifica la conexión: mongosh');
  }
}

/**
 * Mostrar información útil para desarrollo
 */
function showDevelopmentInfo() {
  console.log('\n📋 Información de desarrollo:');
  console.log('  🌐 API: http://localhost:3000');
  console.log('  📱 WebSocket: ws://localhost:3000');
  console.log('  ❤️  Health Check: http://localhost:3000/health');
  console.log('  🎮 API Endpoints: http://localhost:3000/api/games');
  console.log('\n🔧 Comandos útiles:');
  console.log('  - Ver logs: tail -f logs/app.log');
  console.log('  - MongoDB shell: mongosh');
  console.log('  - Reiniciar: npm run dev');
  console.log('\n🐛 Debug:');
  console.log('  - Habilitar debug: DEBUG=cultura-chupistica:* npm run dev');
  console.log('  - Ver base de datos: MongoDB Compass');
  console.log('\n');
}

/**
 * Iniciar aplicación en modo desarrollo
 */
async function startDevelopment() {
  try {
    await setupDevelopmentEnvironment();
    await checkSystemDependencies();
    
    console.log('🚀 Iniciando aplicación en modo desarrollo...\n');
    
    await app.start();
    
    showDevelopmentInfo();
    
  } catch (error) {
    console.error('❌ Error iniciando aplicación:', error);
    process.exit(1);
  }
}

// Iniciar si se ejecuta directamente
if (require.main === module) {
  startDevelopment();
}

module.exports = { startDevelopment };
