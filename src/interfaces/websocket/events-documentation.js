/**
 * Documentación de eventos Socket.IO
 * Este archivo describe todos los eventos disponibles en tiempo real
 */

/**
 * ==========================================
 * EVENTOS DEL CLIENTE AL SERVIDOR
 * ==========================================
 */

/**
 * createGame - Crear una nueva partida
 * @param {Object} data
 * @param {string} data.hostId - ID del jugador host
 * @param {string} [data.customCode] - Código personalizado (opcional)
 * 
 * @response gameCreated
 */

/**
 * joinGame - Unirse a una partida existente
 * @param {Object} data
 * @param {string} data.gameCode - Código de la partida
 * @param {string} data.playerId - ID del jugador
 * 
 * @response gameJoined
 */

/**
 * startGame - Iniciar una partida
 * @param {Object} data
 * @param {string} data.gameCode - Código de la partida
 * @param {string} data.playerId - ID del jugador (debe ser host)
 * 
 * @response gameStarted
 */

/**
 * drawCard - Robar una carta
 * @param {Object} data
 * @param {string} data.gameCode - Código de la partida
 * @param {string} data.playerId - ID del jugador
 * 
 * @response cardDrawn
 */

/**
 * activateCard - Activar una carta guardada
 * @param {Object} data
 * @param {string} data.gameCode - Código de la partida
 * @param {string} data.playerId - ID del jugador
 * @param {string} data.cardId - ID de la carta
 * @param {string} data.cardType - Tipo de carta (brinco, movement, venganza)
 * @param {string} [data.targetPlayerId] - ID del jugador objetivo (para venganza)
 * 
 * @response cardActivated
 */

/**
 * brincoResult - Resultado de una carta "Al brinco"
 * @param {Object} data
 * @param {string} data.gameCode - Código de la partida
 * @param {string} data.playerId - ID del jugador que activó
 * @param {string} data.loserId - ID del jugador que perdió
 * 
 * @response brincoResult
 */

/**
 * movementResult - Resultado de una carta "Al que se mueve"
 * @param {Object} data
 * @param {string} data.gameCode - Código de la partida
 * @param {string} data.playerId - ID del jugador que activó
 * @param {string} data.loserId - ID del jugador que se movió
 * 
 * @response movementResult
 */

/**
 * useVenganza - Usar una carta de venganza
 * @param {Object} data
 * @param {string} data.gameCode - Código de la partida
 * @param {string} data.playerId - ID del jugador
 * @param {string} data.targetPlayerId - ID del jugador objetivo
 * @param {string} data.cardId - ID de la carta de venganza
 * 
 * @response venganzaUsed
 */

/**
 * endGame - Terminar una partida
 * @param {Object} data
 * @param {string} data.gameCode - Código de la partida
 * @param {string} data.playerId - ID del jugador (debe ser host)
 * @param {string} [data.reason] - Razón del fin de partida
 * 
 * @response gameEnded
 */

/**
 * getGameState - Obtener estado actual de la partida
 * @param {Object} data
 * @param {string} data.gameCode - Código de la partida
 * @param {string} [data.playerId] - ID del jugador (opcional)
 * 
 * @response gameState
 */

/**
 * updateRules - Actualizar reglas de la partida
 * @param {Object} data
 * @param {string} data.gameCode - Código de la partida
 * @param {string} data.playerId - ID del jugador (debe ser host)
 * @param {Object} data.rules - Nuevas reglas
 * 
 * @response rulesUpdated
 */

/**
 * joinRoom - Unirse a una sala
 * @param {Object} data
 * @param {string} data.gameCode - Código de la partida
 * 
 * @response roomJoined
 */

/**
 * leaveRoom - Salir de una sala
 * @param {Object} data
 * @param {string} data.gameCode - Código de la partida
 * 
 * @response roomLeft
 */

/**
 * ==========================================
 * EVENTOS DEL SERVIDOR AL CLIENTE
 * ==========================================
 */

/**
 * gameCreated - Respuesta a createGame
 * @param {Object} data
 * @param {boolean} data.success - Éxito de la operación
 * @param {Object} [data.game] - Datos de la partida creada
 * @param {string} [data.message] - Mensaje de éxito
 * @param {Object} [data.error] - Error si falla
 */

/**
 * gameJoined - Respuesta a joinGame
 * @param {Object} data
 * @param {boolean} data.success - Éxito de la operación
 * @param {Object} [data.game] - Datos de la partida
 * @param {string} [data.message] - Mensaje de éxito
 * @param {Object} [data.error] - Error si falla
 */

/**
 * playerJoined - Notificación cuando un jugador se une
 * @param {Object} data
 * @param {string} data.playerId - ID del jugador que se unió
 * @param {number} data.playerCount - Número total de jugadores
 * @param {string[]} data.players - Lista de jugadores
 * @param {Date} data.timestamp - Timestamp del evento
 */

/**
 * gameStarted - Notificación cuando la partida inicia
 * @param {Object} data
 * @param {boolean} data.success - Éxito de la operación
 * @param {Object} [data.game] - Datos de la partida
 * @param {Object} [data.gameInfo] - Información adicional
 * @param {string} [data.message] - Mensaje de éxito
 * @param {Object} [data.error] - Error si falla
 */

/**
 * cardDrawn - Notificación cuando se roba una carta
 * @param {Object} data
 * @param {boolean} data.success - Éxito de la operación
 * @param {Object} [data.card] - Datos de la carta robada
 * @param {Object} [data.rule] - Regla aplicada
 * @param {string} [data.playerId] - ID del jugador que robó
 * @param {string} [data.nextPlayer] - ID del siguiente jugador
 * @param {number} [data.cardsRemaining] - Cartas restantes
 * @param {boolean} [data.isGameOver] - Si la partida terminó
 * @param {Date} data.timestamp - Timestamp del evento
 */

/**
 * cardActivated - Notificación cuando se activa una carta
 * @param {Object} data
 * @param {boolean} data.success - Éxito de la operación
 * @param {Object} [data.activation] - Datos de la activación
 * @param {Object} [data.card] - Datos de la carta activada
 * @param {string} [data.playerId] - ID del jugador que activó
 * @param {Date} data.timestamp - Timestamp del evento
 */

/**
 * brincoResult - Resultado de carta "Al brinco"
 * @param {Object} data
 * @param {string} data.activatorId - ID del jugador que activó
 * @param {string} data.loserId - ID del jugador que perdió
 * @param {string} data.message - Mensaje descriptivo
 * @param {Date} data.timestamp - Timestamp del evento
 */

/**
 * movementResult - Resultado de carta "Al que se mueve"
 * @param {Object} data
 * @param {string} data.activatorId - ID del jugador que activó
 * @param {string} data.loserId - ID del jugador que se movió
 * @param {string} data.message - Mensaje descriptivo
 * @param {Date} data.timestamp - Timestamp del evento
 */

/**
 * venganzaUsed - Notificación cuando se usa venganza
 * @param {Object} data
 * @param {boolean} data.success - Éxito de la operación
 * @param {string} [data.vengadorId] - ID del jugador que se venga
 * @param {string} [data.targetId] - ID del jugador objetivo
 * @param {string} [data.message] - Mensaje descriptivo
 * @param {Date} data.timestamp - Timestamp del evento
 */

/**
 * venganzaStored - Notificación cuando se guarda una venganza
 * @param {Object} data
 * @param {string} data.message - Mensaje descriptivo
 * @param {number} data.totalVenganzas - Total de venganzas guardadas
 */

/**
 * kingsCupUpdate - Actualización de la Copa del Rey
 * @param {Object} data
 * @param {number} data.kingsCount - Número de cartas K sacadas
 * @param {Array} data.cupContent - Contenido del vaso
 * @param {boolean} data.isComplete - Si la copa está completa
 * @param {string} data.nextAction - Próxima acción requerida
 */

/**
 * cardSaved - Notificación cuando se guarda una carta
 * @param {Object} data
 * @param {string} data.message - Mensaje descriptivo
 * @param {Array} data.savedCards - Cartas guardadas del jugador
 */

/**
 * gameEnded - Notificación cuando la partida termina
 * @param {Object} data
 * @param {boolean} [data.success] - Éxito de la operación
 * @param {Object} [data.stats] - Estadísticas finales
 * @param {Object} [data.finalInfo] - Información final
 * @param {string} data.reason - Razón del fin de partida
 * @param {boolean} [data.autoEnd] - Si terminó automáticamente
 * @param {string} [data.message] - Mensaje descriptivo
 * @param {Date} data.timestamp - Timestamp del evento
 */

/**
 * gameState - Respuesta a getGameState
 * @param {Object} data
 * @param {boolean} data.success - Éxito de la operación
 * @param {Object} [data.game] - Resumen de la partida
 * @param {Object} [data.fullGame] - Datos completos de la partida
 * @param {Object} [data.error] - Error si falla
 */

/**
 * rulesUpdated - Notificación cuando se actualizan reglas
 * @param {Object} data
 * @param {boolean} data.success - Éxito de la operación
 * @param {Object} [data.updatedRules] - Reglas actualizadas
 * @param {Object} [data.currentRules] - Reglas actuales
 * @param {string} [data.playerId] - ID del jugador que actualizó
 * @param {Date} data.timestamp - Timestamp del evento
 */

/**
 * roomJoined - Respuesta a joinRoom
 * @param {Object} data
 * @param {boolean} data.success - Éxito de la operación
 * @param {string} [data.gameCode] - Código de la partida
 * @param {string} [data.message] - Mensaje de éxito
 * @param {Object} [data.error] - Error si falla
 */

/**
 * roomLeft - Respuesta a leaveRoom
 * @param {Object} data
 * @param {boolean} data.success - Éxito de la operación
 * @param {string} [data.gameCode] - Código de la partida
 * @param {string} [data.message] - Mensaje de éxito
 * @param {Object} [data.error] - Error si falla
 */

/**
 * playerDisconnected - Notificación cuando un jugador se desconecta
 * @param {Object} data
 * @param {string} data.socketId - ID del socket desconectado
 * @param {Date} data.timestamp - Timestamp del evento
 */

/**
 * ==========================================
 * EVENTOS DE SISTEMA
 * ==========================================
 */

/**
 * connect - Cuando el cliente se conecta
 */

/**
 * disconnect - Cuando el cliente se desconecta
 */

/**
 * error - Cuando ocurre un error
 */

module.exports = {
  // Esta es solo documentación, no se exporta nada
};
