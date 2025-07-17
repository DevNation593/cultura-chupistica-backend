#!/usr/bin/env node

/**
 * Script de inicio para producción
 * Configuración optimizada para entorno de producción
 */

const app = require('./src/app');
const DatabaseConfig = require('./src/infrastructure/db/DatabaseConfig');

/**
 * Configuración específica para producción
 */
async function setupProductionEnvironment() {
  console.log('🚀 Configurando entorno de producción...');
  
  // Configurar variables de entorno para producción
  process.env.NODE_ENV = 'production';
  process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'info';
  
  // Validar variables de entorno críticas
  const requiredEnvVars = [
    'MONGO_URI',
    'PORT'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Variables de entorno faltantes:', missingVars.join(', '));
    console.error('💡 Configura las variables de entorno necesarias');
    process.exit(1);
  }
  
  // Configurar límites de memoria para Node.js
  if (!process.env.NODE_OPTIONS) {
    process.env.NODE_OPTIONS = '--max-old-space-size=512';
  }
  
  console.log('✅ Entorno de producción configurado');
}

/**
 * Verificar recursos del sistema
 */
async function checkSystemResources() {
  console.log('🔧 Verificando recursos del sistema...');
  
  try {
    // Verificar memoria disponible
    const memoryUsage = process.memoryUsage();
    const memoryInMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    
    console.log(`📊 Memoria en uso: ${memoryInMB}MB`);
    
    // Verificar base de datos
    const dbHealth = await DatabaseConfig.healthCheck();
    if (!dbHealth.isHealthy) {
      throw new Error('Base de datos no está disponible');
    }
    
    console.log('✅ Recursos del sistema verificados');
    
  } catch (error) {
    console.error('❌ Error verificando recursos:', error.message);
    throw error;
  }
}

/**
 * Configurar manejo de proceso para producción
 */
function setupProcessHandling() {
  console.log('🔧 Configurando manejo de proceso...');
  
  // Configurar límites de proceso
  if (process.setMaxListeners) {
    process.setMaxListeners(20);
  }
  
  // Configurar timeout para operaciones
  if (process.env.PROCESS_TIMEOUT) {
    const timeout = parseInt(process.env.PROCESS_TIMEOUT) * 1000;
    setTimeout(() => {
      console.error('❌ Timeout del proceso alcanzado');
      process.exit(1);
    }, timeout);
  }
  
  console.log('✅ Manejo de proceso configurado');
}

/**
 * Mostrar información de producción
 */
function showProductionInfo() {
  console.log('\n📋 Información de producción:');
  console.log(`  🌐 Puerto: ${process.env.PORT}`);
  console.log(`  🗄️  Base de datos: ${process.env.MONGO_URI ? 'Configurada' : 'No configurada'}`);
  console.log(`  📊 Memoria límite: ${process.env.NODE_OPTIONS || 'Por defecto'}`);
  console.log(`  📝 Nivel de log: ${process.env.LOG_LEVEL || 'info'}`);
  console.log('\n');
}

/**
 * Iniciar aplicación en modo producción
 */
async function startProduction() {
  try {
    await setupProductionEnvironment();
    await checkSystemResources();
    setupProcessHandling();
    
    console.log('🚀 Iniciando aplicación en modo producción...\n');
    
    await app.start();
    
    showProductionInfo();
    
    console.log('🎉 Aplicación ejecutándose en modo producción');
    
  } catch (error) {
    console.error('❌ Error iniciando aplicación en producción:', error);
    process.exit(1);
  }
}

// Iniciar si se ejecuta directamente
if (require.main === module) {
  startProduction();
}

module.exports = { startProduction };
