/**
 * Aplicación principal - Cultura Chupística Backend
 * Integra todos los componentes de la arquitectura hexagonal
 */
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

// Importar configuraciones
const DatabaseConfig = require('./infrastructure/db/DatabaseConfig');
const { initializeDomainServices, validateDomainServices } = require('./domain/services');

// Importar casos de uso
const CreateGame = require('./application/use-cases/CreateGame');
const JoinGame = require('./application/use-cases/JoinGame');
const DrawCard = require('./application/use-cases/DrawCard');
const ActivateCard = require('./application/use-cases/ActivateCard');
const EndGame = require('./application/use-cases/EndGame');

// Importar controladores e infraestructura
const GameController = require('./interfaces/http/controllers/GameController');
const GameRoutes = require('./interfaces/http/routes/GameRoutes');
const GameRepository = require('./infrastructure/db/GameRepository');
const SocketServer = require('./infrastructure/websocket/SocketServer');
const GameSocketHandler = require('./interfaces/websocket/GameSocketHandler');

/**
 * Clase principal de la aplicación
 */
class CulturaChupIsticaApp {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: { 
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST"]
      }
    });
    
    // Contenedor de dependencias
    this.dependencies = {};
    
    // Estado de la aplicación
    this.isInitialized = false;
    this.isShuttingDown = false;
  }

  /**
   * Inicializar la aplicación
   */
  async initialize() {
    try {
      console.log('🚀 Iniciando Cultura Chupística Backend...');
      
      // 1. Configurar base de datos
      await this.setupDatabase();
      
      // 2. Inicializar servicios de dominio
      await this.setupDomainServices();
      
      // 3. Configurar dependencias
      await this.setupDependencies();
      
      // 4. Configurar middlewares
      this.setupMiddlewares();
      
      // 5. Configurar rutas HTTP
      this.setupHttpRoutes();
      
      // 6. Configurar WebSocket
      this.setupWebSocket();
      
      // 7. Configurar manejo de errores
      this.setupErrorHandling();
      
      // 8. Validar servicios
      await this.validateServices();
      
      this.isInitialized = true;
      console.log('✅ Aplicación inicializada correctamente');
      
    } catch (error) {
      console.error('❌ Error durante inicialización:', error);
      throw error;
    }
  }

  /**
   * Configurar conexión a base de datos
   */
  async setupDatabase() {
    console.log('🔧 Configurando base de datos...');
    
    try {
      // Obtener URI de MongoDB desde variables de entorno
      const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/cultura_chupistica';
      
      // Conectar a la base de datos
      await DatabaseConfig.connect(mongoUri);
      
      // Verificar salud de la base de datos
      const healthCheck = await DatabaseConfig.healthCheck();
      if (!healthCheck.isHealthy) {
        throw new Error('Base de datos no está saludable');
      }
      if (!healthCheck.isHealthy) {
        throw new Error('Base de datos no está saludable');
      }
      
      console.log('✅ Base de datos configurada');
      
    } catch (error) {
      console.error('❌ Error configurando base de datos:', error);
      throw error;
    }
  }

  /**
   * Inicializar servicios de dominio
   */
  async setupDomainServices() {
    console.log('🔧 Configurando servicios de dominio...');
    
    try {
      this.dependencies.domainServices = initializeDomainServices({
        environment: process.env.NODE_ENV || 'development',
        logLevel: process.env.LOG_LEVEL || 'info'
      });
      
      console.log('✅ Servicios de dominio configurados');
      
    } catch (error) {
      console.error('❌ Error configurando servicios de dominio:', error);
      throw error;
    }
  }

  /**
   * Configurar contenedor de dependencias
   */
  async setupDependencies() {
    console.log('🔧 Configurando dependencias...');
    
    try {
      // Repositorio
      this.dependencies.gameRepository = new GameRepository();
      
      // Casos de uso
      this.dependencies.useCases = {
        createGame: new CreateGame(this.dependencies.gameRepository, this.dependencies.domainServices.gameService),
        joinGame: new JoinGame(this.dependencies.gameRepository, this.dependencies.domainServices.gameService),
        drawCard: new DrawCard(this.dependencies.gameRepository, this.dependencies.domainServices.cardService),
        activateCard: new ActivateCard(this.dependencies.gameRepository, this.dependencies.domainServices.cardService),
        endGame: new EndGame(this.dependencies.gameRepository, this.dependencies.domainServices.gameService)
      };
      
      // Controlador
      this.dependencies.gameController = new GameController(
        this.dependencies.useCases,
        this.dependencies.domainServices
      );
      
      // Servidor WebSocket
      this.dependencies.socketServer = new SocketServer(this.server);
      
      // Manejador de sockets (deshabilitado temporalmente)
      // this.dependencies.gameSocketHandler = new GameSocketHandler(
      //   this.dependencies.socketServer,
      //   this.dependencies.useCases,
      //   this.dependencies.domainServices
      // );
      
      console.log('✅ Dependencias configuradas');
      
    } catch (error) {
      console.error('❌ Error configurando dependencias:', error);
      throw error;
    }
  }

  /**
   * Configurar middlewares
   */
  setupMiddlewares() {
    console.log('🔧 Configurando middlewares...');
    
    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || "*",
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    
    // Body parser
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Logging middleware
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
    
    // Request ID middleware
    this.app.use((req, res, next) => {
      req.requestId = Math.random().toString(36).substr(2, 9);
      res.setHeader('X-Request-ID', req.requestId);
      next();
    });
    
    console.log('✅ Middlewares configurados');
  }

  /**
   * Configurar rutas HTTP
   */
  setupHttpRoutes() {
    console.log('🔧 Configurando rutas HTTP...');
    
    // Ruta de salud
    this.app.get('/health', async (req, res) => {
      try {
        const dbHealth = await DatabaseConfig.healthCheck();
        const servicesValidation = validateDomainServices();
        
        const health = {
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          database: dbHealth,
          services: servicesValidation,
          version: process.env.npm_package_version || '1.0.0'
        };
        
        res.json(health);
      } catch (error) {
        res.status(500).json({
          status: 'error',
          message: error.message
        });
      }
    });
    
    // Ruta principal
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Cultura Chupística API',
        version: process.env.npm_package_version || '1.0.0',
        status: 'running',
        endpoints: {
          health: '/health',
          games: '/api/games',
          websocket: '/socket.io'
        }
      });
    });
    
    // Rutas de la API
    const gameRouter = GameRoutes(this.dependencies.gameController);
    this.app.use('/api/games', gameRouter);
    
    console.log('✅ Rutas HTTP configuradas');
  }

  /**
   * Configurar WebSocket
   */
  setupWebSocket() {
    console.log('🔧 Configurando WebSocket...');
    
    // Inicializar manejador de sockets (temporalmente deshabilitado)
    console.log('✅ WebSocket configurado (modo básico)');
  }

  /**
   * Configurar manejo de errores
   */
  setupErrorHandling() {
    console.log('🔧 Configurando manejo de errores...');
    
    // Middleware de manejo de errores
    this.app.use((err, req, res, next) => {
      console.error(`Error en ${req.method} ${req.path}:`, err);
      
      // Error de validación
      if (err.name === 'ValidationError') {
        return res.status(400).json({
          error: 'Datos inválidos',
          message: err.message,
          requestId: req.requestId
        });
      }
      
      // Error de MongoDB
      if (err.name === 'MongoError' || err.name === 'MongoServerError') {
        return res.status(500).json({
          error: 'Error de base de datos',
          message: 'Error interno del servidor',
          requestId: req.requestId
        });
      }
      
      // Error general
      res.status(500).json({
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno',
        requestId: req.requestId
      });
    });
    
    // Manejo de rutas no encontradas
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Ruta no encontrada',
        message: `La ruta ${req.method} ${req.originalUrl} no existe`,
        requestId: req.requestId
      });
    });
    
    // Manejo de errores no capturados
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      if (!this.isShuttingDown) {
        this.gracefulShutdown('unhandledRejection');
      }
    });
    
    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
      if (!this.isShuttingDown) {
        this.gracefulShutdown('uncaughtException');
      }
    });
    
    console.log('✅ Manejo de errores configurado');
  }

  /**
   * Validar servicios
   */
  async validateServices() {
    console.log('🔧 Validando servicios...');
    
    try {
      const validation = validateDomainServices();
      
      if (!validation.isValid) {
        throw new Error(`Servicios inválidos: ${validation.errors.join(', ')}`);
      }
      
      console.log('✅ Servicios validados');
      
    } catch (error) {
      console.error('❌ Error validando servicios:', error);
      throw error;
    }
  }

  /**
   * Iniciar servidor
   */
  async start() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const PORT = process.env.PORT || 3000;
    
    return new Promise((resolve, reject) => {
      this.server.listen(PORT, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
          console.log(`📱 WebSocket disponible en ws://localhost:${PORT}`);
          console.log(`🌐 API disponible en http://localhost:${PORT}`);
          resolve();
        }
      });
    });
  }

  /**
   * Cierre graceful del servidor
   */
  async gracefulShutdown(reason) {
    if (this.isShuttingDown) {
      return;
    }
    
    this.isShuttingDown = true;
    console.log(`🔄 Iniciando cierre graceful del servidor (${reason})...`);
    
    try {
      // Cerrar servidor HTTP
      await new Promise((resolve) => {
        this.server.close(resolve);
      });
      
      // Cerrar conexiones WebSocket
      this.io.close();
      
      // Cerrar conexión a base de datos
      await DatabaseConfig.disconnect();
      
      console.log('✅ Cierre graceful completado');
      process.exit(0);
      
    } catch (error) {
      console.error('❌ Error durante cierre graceful:', error);
      process.exit(1);
    }
  }
}

// Manejo de señales del sistema
process.on('SIGTERM', () => {
  console.log('Recibida señal SIGTERM');
  app.gracefulShutdown('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Recibida señal SIGINT');
  app.gracefulShutdown('SIGINT');
});

// Crear instancia de la aplicación
const app = new CulturaChupIsticaApp();

// Iniciar aplicación si se ejecuta directamente
if (require.main === module) {
  app.start().catch((error) => {
    console.error('❌ Error iniciando aplicación:', error);
    process.exit(1);
  });
}

module.exports = app;
