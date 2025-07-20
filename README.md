# 🍺 Cultura Chupística - Backend

Backend para el juego de cartas español "Cultura Chupística" construido con Node.js, Express, Socket.IO y MongoDB usando arquitectura hexagonal.

## 🎯 Características

- **Arquitectura Hexagonal**: Separación clara de responsabilidades
- **Tiempo Real**: WebSocket con Socket.IO para comunicación en tiempo real
- **Base de Datos**: MongoDB con Mongoose ODM
- **Validación Robusta**: Sistema completo de validación de dominio
- **Eventos y Notificaciones**: Sistema de eventos con notificaciones automáticas
- **Estadísticas**: Análisis detallado de partidas y jugadores
- **API REST**: Endpoints HTTP para gestión de juegos

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 14.0.0 o superior
- MongoDB 4.4 o superior
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/DevNation593/cultura-chupistica-backend.git
cd cultura-chupistica-backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar MongoDB (macOS con Homebrew)
brew services start mongodb-community

# Resetear y poblar base de datos de desarrollo
npm run db:reset
npm run db:seed

# Iniciar en modo desarrollo
npm run dev
```

### Verificación de Instalación

```bash
# Verificar salud del sistema
npm run health

# Ver logs en tiempo real
npm run logs
```

## 📖 Reglas del Juego

### Cartas Especiales

- **A (As)**: Venganza - Se usa para hacer tomar a alguien cuando se acabe el juego
- **K (Rey)**: Copa del Rey - 1ra K: llenar 1/4 del vaso con licor, 2da K: añadir más, 3ra K: completar más, 4ta K: llenar completamente y tomárselo
- **Q (Reina)**: El jugador de la derecha toma
- **J (Jota)**: El jugador de la izquierda toma
- **10**: Al juez (quien está sirviendo) o Historia - Entre todos forman una historia diciendo una palabra, repitiendo las anteriores y sumando una más hasta que alguien se equivoque
- **9**: Al que se mueve - La persona guarda esta carta y cuando quiera usarla cuenta 1,2,3 al que se mueve. El que sacó la carta puede moverse y ver quién se mueve para que tome
- **8**: Al más joven o Colores - Rojos: al más pequeño de cualquier cosa, Negros: al más grande de cualquier cosa
- **7**: 7 pum - Todo número multiplicado o terminado en 7 no se nombra, se dice pum y cambia el sentido de juego
- **6**: Al que vez - La primera persona a la que veas tiene que tomar
- **5**: Al brinco - La persona guarda esta carta y cuando quiera usarla cuenta 1,2,3 al brinco y el último que salte toma
- **4**: Al más gato (ojos más claros) o Mi barquito - "Mi barquito viene cargado de..." (ejemplo: marcas de celulares)
- **3**: Yo nunca nunca - Las personas alzan 3 dedos y van diciendo cosas que nunca hayan hecho pero que piensen que los demás sí, para que bajen los dedos. La persona o personas que bajen todos sus dedos deben tomar
- **2**: A vos - Toma la persona que sacó la carta

## 🏗️ Arquitectura

```
src/
├── app.js                      # Aplicación principal
├── application/                # Capa de aplicación
│   └── use-cases/             # Casos de uso
│       ├── ActivateCard.js
│       ├── CreateGame.js
│       ├── DrawCard.js
│       ├── EndGame.js
│       └── JoinGame.js
├── domain/                     # Capa de dominio
│   ├── models/                # Modelos de dominio
│   │   ├── Card.js
│   │   └── Game.js
│   └── services/              # Servicios de dominio
│       ├── CardService.js
│       ├── GameService.js
│       ├── GameEventService.js
│       ├── GameValidationService.js
│       ├── GameStatsService.js
│       ├── GameNotificationService.js
│       └── index.js
├── infrastructure/             # Capa de infraestructura
│   ├── db/                    # Base de datos
│   │   ├── DatabaseConfig.js
│   │   ├── GameModel.js
│   │   └── GameRepository.js
│   └── websocket/             # WebSocket
│       └── SocketServer.js
└── interfaces/                # Capa de interfaces
    ├── http/                  # HTTP REST API
    │   ├── controllers/
    │   │   └── GameController.js
    │   └── routes/
    │       └── GameRoutes.js
    └── websocket/             # WebSocket handlers
        └── GameSocketHandler.js
```

## 🔌 API Endpoints

### HTTP REST API

```
GET    /                    # Información de la API
GET    /health              # Estado del sistema
POST   /api/games           # Crear nuevo juego
GET    /api/games/:code     # Obtener juego por código
POST   /api/games/:code/join # Unirse a un juego
POST   /api/games/:code/start # Iniciar juego
POST   /api/games/:code/draw # Robar carta
POST   /api/games/:code/activate # Activar carta
POST   /api/games/:code/end # Terminar juego
```

### WebSocket Events

#### Cliente → Servidor
```javascript
// Unirse a un juego
socket.emit('joinGame', { gameCode: 'ABC123', playerId: 'player1' });

// Robar carta
socket.emit('drawCard', { gameCode: 'ABC123', playerId: 'player1' });

// Activar carta
socket.emit('activateCard', { gameCode: 'ABC123', cardId: 'card1', playerId: 'player1' });
```

#### Servidor → Cliente
```javascript
// Jugador se unió
socket.on('playerJoined', (data) => { /* ... */ });

// Carta robada
socket.on('cardDrawn', (data) => { /* ... */ });

// Carta activada
socket.on('cardActivated', (data) => { /* ... */ });

// Notificación
socket.on('notification', (data) => { /* ... */ });
```

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar en modo desarrollo
npm run dev:watch        # Iniciar con auto-reinicio

# Producción
npm start               # Iniciar en modo producción

# Base de datos
npm run db:reset        # Resetear base de datos
npm run db:seed         # Poblar con datos de prueba

# Utilidades
npm run health          # Verificar salud del sistema
npm run logs           # Ver logs en tiempo real
```

## 🧪 Testing

```bash
# Ejecutar todas las pruebas
npm test

# Pruebas unitarias
npm run test:unit

# Pruebas de integración
npm run test:integration
```

## 🔧 Configuración

### Variables de Entorno

```env
# Aplicación
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Base de datos
MONGO_URI=mongodb://localhost:27017/cultura_chupistica

# Seguridad
CORS_ORIGIN=*
JWT_SECRET=your-secret-key

# Juego
MAX_PLAYERS_PER_GAME=8
GAME_TIMEOUT_MINUTES=30
```

### Configuración de Desarrollo

```javascript
// dev.js - Configuración específica para desarrollo
const app = require('./src/app');

// Configurar entorno de desarrollo
process.env.NODE_ENV = 'development';
process.env.LOG_LEVEL = 'debug';

// Iniciar aplicación
app.start();
```

## 📊 Monitoreo

### Health Check

```bash
curl http://localhost:3000/health
```

Respuesta:
```json
{
  "status": "ok",
  "timestamp": "2025-07-16T...",
  "uptime": 123.45,
  "database": {
    "isHealthy": true,
    "responseTime": "5ms"
  },
  "services": {
    "isValid": true,
    "errors": []
  }
}
```

### Logs

```bash
# Ver logs en tiempo real
npm run logs

# Logs específicos
tail -f logs/app.log | grep ERROR
```

## 🎮 Flujo de Juego

1. **Crear Juego**: El host crea un juego y obtiene un código
2. **Unirse**: Los jugadores se unen usando el código
3. **Iniciar**: El host inicia el juego
4. **Turnos**: Los jugadores roban cartas por turnos
5. **Activar**: Cada carta tiene un efecto específico
6. **Terminar**: El juego termina cuando se acaban las cartas

## 🚀 Despliegue

### Desarrollo Local

```bash
# Iniciar MongoDB
brew services start mongodb-community

# Iniciar aplicación
npm run dev
```

### Producción

```bash
# Configurar variables de entorno
export NODE_ENV=production
export MONGO_URI=mongodb://your-production-db

# Iniciar aplicación
npm start
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la licencia ISC. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas:

1. **Verifica prerrequisitos**: Node.js y MongoDB
2. **Revisa logs**: `npm run logs`
3. **Health check**: `npm run health`
4. **Resetea base de datos**: `npm run db:reset && npm run db:seed`

### Problemas Comunes

#### MongoDB no se conecta
```bash
# Instalar MongoDB
brew install mongodb-community

# Iniciar servicio
brew services start mongodb-community

# Verificar conexión
mongosh
```

#### Puerto en uso
```bash
# Cambiar puerto en .env
PORT=3001

# O terminar proceso
lsof -ti:3000 | xargs kill -9
```

#### Dependencias faltantes
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

---

**Desarrollado con ❤️ para la comunidad de juegos**