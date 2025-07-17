#!/usr/bin/env node

/**
 * Script de verificación de salud del sistema
 * Puede ejecutarse independientemente para verificar el estado
 */

const http = require('http');
const { config } = require('./config');

/**
 * Verificar endpoint de salud
 */
async function checkHealthEndpoint() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: config.server.host,
      port: config.server.port,
      path: '/health',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const healthData = JSON.parse(data);
          resolve({
            success: true,
            status: res.statusCode,
            data: healthData
          });
        } catch (error) {
          reject({
            success: false,
            error: 'Respuesta inválida del servidor',
            details: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({
        success: false,
        error: 'Error conectando al servidor',
        details: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        success: false,
        error: 'Timeout conectando al servidor',
        details: 'El servidor no respondió en 5 segundos'
      });
    });

    req.end();
  });
}

/**
 * Verificar conectividad básica
 */
async function checkBasicConnectivity() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: config.server.host,
      port: config.server.port,
      path: '/',
      method: 'GET',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      resolve({
        success: true,
        status: res.statusCode,
        message: 'Servidor responde correctamente'
      });
    });

    req.on('error', (error) => {
      reject({
        success: false,
        error: 'Servidor no disponible',
        details: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        success: false,
        error: 'Timeout de conexión',
        details: 'El servidor no respondió en 3 segundos'
      });
    });

    req.end();
  });
}

/**
 * Ejecutar verificación completa
 */
async function runHealthCheck() {
  console.log('🔍 Verificando salud del sistema...\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    checks: [],
    overall: 'unknown'
  };
  
  try {
    // Verificar conectividad básica
    console.log('📡 Verificando conectividad básica...');
    const connectivityResult = await checkBasicConnectivity();
    results.checks.push({
      name: 'Conectividad Básica',
      status: connectivityResult.success ? 'ok' : 'error',
      message: connectivityResult.message || connectivityResult.error,
      details: connectivityResult.details
    });
    
    if (connectivityResult.success) {
      console.log('✅ Conectividad básica: OK');
    } else {
      console.log('❌ Conectividad básica: ERROR');
    }
    
    // Verificar endpoint de salud
    console.log('🩺 Verificando endpoint de salud...');
    const healthResult = await checkHealthEndpoint();
    results.checks.push({
      name: 'Endpoint de Salud',
      status: healthResult.success ? 'ok' : 'error',
      message: healthResult.success ? 'Health check exitoso' : healthResult.error,
      details: healthResult.data || healthResult.details
    });
    
    if (healthResult.success) {
      console.log('✅ Endpoint de salud: OK');
      
      // Mostrar detalles del health check
      if (healthResult.data) {
        console.log('\n📊 Detalles del sistema:');
        console.log(`  Estado: ${healthResult.data.status}`);
        console.log(`  Uptime: ${Math.round(healthResult.data.uptime)}s`);
        console.log(`  Base de datos: ${healthResult.data.database?.isHealthy ? 'Saludable' : 'Error'}`);
        console.log(`  Servicios: ${healthResult.data.services?.isValid ? 'Válidos' : 'Error'}`);
        console.log(`  Versión: ${healthResult.data.version}`);
      }
    } else {
      console.log('❌ Endpoint de salud: ERROR');
    }
    
    // Determinar estado general
    const hasErrors = results.checks.some(check => check.status === 'error');
    results.overall = hasErrors ? 'error' : 'ok';
    
    console.log('\n🎯 Resultado general:');
    if (results.overall === 'ok') {
      console.log('✅ Sistema saludable');
      process.exit(0);
    } else {
      console.log('❌ Sistema con problemas');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error durante verificación:', error);
    process.exit(1);
  }
}

/**
 * Mostrar ayuda
 */
function showHelp() {
  console.log(`
🩺 Health Check - Cultura Chupística Backend

Uso: node healthcheck.js [opciones]

Opciones:
  --help, -h     Mostrar esta ayuda
  --json         Salida en formato JSON
  --quiet        Solo mostrar errores
  --timeout=N    Timeout en segundos (default: 5)

Ejemplos:
  node healthcheck.js
  node healthcheck.js --json
  node healthcheck.js --quiet
  node healthcheck.js --timeout=10

Códigos de salida:
  0    Sistema saludable
  1    Sistema con problemas
  2    Error en los parámetros
`);
}

// Procesar argumentos de línea de comandos
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Verificar si el servidor debe estar ejecutándose
if (args.includes('--check-running')) {
  console.log(`🔍 Verificando si el servidor está ejecutándose en puerto ${config.server.port}...`);
}

// Ejecutar verificación
if (require.main === module) {
  runHealthCheck();
}

module.exports = {
  checkHealthEndpoint,
  checkBasicConnectivity,
  runHealthCheck
};
