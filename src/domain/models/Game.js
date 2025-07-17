const Card = require('./Card');

/**
 * Modelo de dominio para una partida del juego
 */
class Game {
  constructor(code, host) {
    this.code = code;                    // Código único de la sala
    this.host = host;                    // ID del jugador host
    this.players = [host];               // Array de jugadores conectados
    this.deck = this._createDeck();      // Baraja completa (52 cartas)
    this.history = [];                   // Historial de cartas jugadas
    this.rules = this._getDefaultRules(); // Reglas personalizadas por carta
    this.status = 'waiting';             // 'waiting' | 'started' | 'ended'
    this.currentTurn = 0;                // Índice del jugador actual
    this.createdAt = new Date();
    this.startedAt = null;
    this.endedAt = null;
    this.savedCards = {};                // Cartas guardadas por jugador
    this.kingsCount = 0;                 // Contador de cartas K sacadas (para Copa del Rey)
    this.cupContent = [];                // Contenido del vaso del Rey
    this.venganzaCards = [];             // Cartas A guardadas para venganza al final
  }

  /**
   * Crea una baraja completa de 52 cartas
   * @returns {Array<Card>}
   */
  _createDeck() {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];

    suits.forEach(suit => {
      ranks.forEach(rank => {
        deck.push(new Card(suit, rank));
      });
    });

    return this._shuffleDeck(deck);
  }

  /**
   * Mezcla la baraja usando el algoritmo Fisher-Yates
   * @param {Array<Card>} deck 
   * @returns {Array<Card>}
   */
  _shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Obtiene las reglas por defecto para cada carta
   * @returns {Object}
   */
  _getDefaultRules() {
    return {
      'A': 'Venganza - Se usa para hacer tomar a alguien cuando se acabe el juego',
      '2': 'A vos - Toma la persona que sacó la carta',
      '3': 'Yo nunca nunca - Las personas alzan 3 dedos y van diciendo cosas que nunca hayan hecho pero que piensen que los demás sí, para que bajen los dedos. La persona o personas que bajen todos sus dedos deben tomar',
      '4': 'Al más gato (ojos más claros) o Mi barquito - "Mi barquito viene cargado de..." (ejemplo: marcas de celulares)',
      '5': 'Al brinco - La persona guarda esta carta y cuando quiera usarla cuenta 1,2,3 al brinco y el último que salte toma',
      '6': 'Al que vez - La primera persona a la que veas tiene que tomar',
      '7': '7 pum - Todo número multiplicado o terminado en 7 no se nombra, se dice pum y cambia el sentido de juego',
      '8': 'Al más joven o Colores - Rojos: al más pequeño de cualquier cosa, Negros: al más grande de cualquier cosa',
      '9': 'Al que se mueve - La persona guarda esta carta y cuando quiera usarla cuenta 1,2,3 al que se mueve. El que sacó la carta puede moverse y ver quién se mueve para que tome',
      '10': 'Al juez (quien está sirviendo) o Historia - Entre todos forman una historia diciendo una palabra, repitiendo las anteriores y sumando una más hasta que alguien se equivoque',
      'J': 'El jugador de la izquierda toma',
      'Q': 'El jugador de la derecha toma',
      'K': 'Copa del Rey - 1ra K: llenar 1/4 del vaso con licor, 2da K: añadir más, 3ra K: completar más, 4ta K: llenar completamente y tomárselo'
    };
  }

  /**
   * Añade un jugador a la partida
   * @param {string} playerId 
   * @returns {boolean} true si se añadió correctamente
   */
  addPlayer(playerId) {
    if (this.status !== 'waiting') {
      throw new Error('No se puede unir a una partida que ya ha comenzado');
    }

    if (this.players.includes(playerId)) {
      throw new Error('El jugador ya está en la partida');
    }

    if (this.players.length >= 8) {
      throw new Error('La partida está completa (máximo 8 jugadores)');
    }

    this.players.push(playerId);
    this.savedCards[playerId] = [];
    return true;
  }

  /**
   * Elimina un jugador de la partida
   * @param {string} playerId 
   * @returns {boolean} true si se eliminó correctamente
   */
  removePlayer(playerId) {
    const index = this.players.indexOf(playerId);
    if (index === -1) {
      return false;
    }

    this.players.splice(index, 1);
    delete this.savedCards[playerId];

    // Si es el host, asignar nuevo host
    if (this.host === playerId && this.players.length > 0) {
      this.host = this.players[0];
    }

    // Ajustar el turno actual si es necesario
    if (this.currentTurn >= this.players.length) {
      this.currentTurn = 0;
    }

    return true;
  }

  /**
   * Inicia la partida
   * @returns {boolean} true si se inició correctamente
   */
  startGame() {
    if (this.status !== 'waiting') {
      throw new Error('La partida ya ha comenzado o ha terminado');
    }

    if (this.players.length < 2) {
      throw new Error('Se necesitan al menos 2 jugadores para iniciar');
    }

    this.status = 'started';
    this.startedAt = new Date();
    this.currentTurn = 0;
    
    // Inicializar cartas guardadas para cada jugador
    this.players.forEach(playerId => {
      this.savedCards[playerId] = [];
    });

    return true;
  }

  /**
   * Roba una carta del mazo
   * @param {string} playerId 
   * @returns {Card|null} la carta robada o null si no hay más cartas
   */
  drawCard(playerId) {
    if (this.status !== 'started') {
      throw new Error('La partida no ha comenzado');
    }

    if (this.getCurrentPlayer() !== playerId) {
      throw new Error('No es el turno de este jugador');
    }

    if (this.deck.length === 0) {
      this.endGame();
      return null;
    }

    const card = this.deck.pop();
    
    // Manejar cartas especiales
    if (card.rank === 'K') {
      this.kingsCount++;
      this.cupContent.push({
        playerId,
        kingNumber: this.kingsCount,
        timestamp: new Date()
      });
    }

    // Las cartas A se pueden usar para venganza al final
    if (card.rank === 'A') {
      this.venganzaCards.push({
        playerId,
        card: card.toJSON(),
        timestamp: new Date()
      });
    }

    const historyEntry = {
      card: card.toJSON(),
      playerId,
      timestamp: new Date(),
      rule: this.rules[card.rank],
      kingsCount: card.rank === 'K' ? this.kingsCount : undefined
    };

    this.history.push(historyEntry);
    this.nextTurn();

    return card;
  }

  /**
   * Guarda una carta para uso posterior
   * @param {string} playerId 
   * @param {Card} card 
   * @returns {boolean} true si se guardó correctamente
   */
  saveCard(playerId, card) {
    if (!this.players.includes(playerId)) {
      throw new Error('El jugador no está en la partida');
    }

    if (this.savedCards[playerId].length >= 3) {
      throw new Error('El jugador ya tiene el máximo de cartas guardadas (3)');
    }

    this.savedCards[playerId].push(card.toJSON());
    return true;
  }

  /**
   * Activa una carta guardada
   * @param {string} playerId 
   * @param {string} cardId 
   * @returns {Card|null} la carta activada
   */
  activateCard(playerId, cardId) {
    if (!this.players.includes(playerId)) {
      throw new Error('El jugador no está en la partida');
    }

    const savedCards = this.savedCards[playerId];
    const cardIndex = savedCards.findIndex(card => card.id === cardId);

    if (cardIndex === -1) {
      throw new Error('La carta no está guardada');
    }

    const cardData = savedCards.splice(cardIndex, 1)[0];
    const card = Card.fromJSON(cardData);

    const historyEntry = {
      card: card.toJSON(),
      playerId,
      timestamp: new Date(),
      rule: this.rules[card.rank],
      isActivated: true
    };

    this.history.push(historyEntry);
    return card;
  }

  /**
   * Activa una carta "Al brinco" (5)
   * @param {string} playerId 
   * @param {string} cardId 
   * @returns {Object} resultado de la activación
   */
  activateBrincoCard(playerId, cardId) {
    const card = this.activateCard(playerId, cardId);
    if (card.rank !== '5') {
      throw new Error('Esta carta no es una carta de brinco');
    }

    return {
      card: card.toJSON(),
      message: 'Carta de brinco activada: 1, 2, 3 ¡AL BRINCO! El último que salte toma.',
      playerId,
      timestamp: new Date()
    };
  }

  /**
   * Activa una carta "Al que se mueve" (9)
   * @param {string} playerId 
   * @param {string} cardId 
   * @returns {Object} resultado de la activación
   */
  activateMoveCard(playerId, cardId) {
    const card = this.activateCard(playerId, cardId);
    if (card.rank !== '9') {
      throw new Error('Esta carta no es una carta de movimiento');
    }

    return {
      card: card.toJSON(),
      message: 'Carta de movimiento activada: 1, 2, 3 ¡AL QUE SE MUEVE! El que se mueva toma.',
      playerId,
      timestamp: new Date()
    };
  }

  /**
   * Usa una carta de venganza al final del juego
   * @param {string} playerId 
   * @param {string} targetPlayerId 
   * @returns {Object} resultado de la venganza
   */
  useVenganza(playerId, targetPlayerId) {
    if (this.status !== 'ended') {
      throw new Error('La venganza solo se puede usar al final del juego');
    }

    const venganzaCard = this.venganzaCards.find(v => v.playerId === playerId);
    if (!venganzaCard) {
      throw new Error('Este jugador no tiene cartas de venganza');
    }

    if (!this.players.includes(targetPlayerId)) {
      throw new Error('El jugador objetivo no está en la partida');
    }

    // Remover la carta de venganza usada
    this.venganzaCards = this.venganzaCards.filter(v => v.playerId !== playerId);

    const historyEntry = {
      card: venganzaCard.card,
      playerId,
      targetPlayerId,
      timestamp: new Date(),
      rule: 'Venganza - Hacer tomar a alguien al final del juego',
      isVenganza: true
    };

    this.history.push(historyEntry);

    return {
      card: venganzaCard.card,
      message: `${playerId} usa venganza contra ${targetPlayerId}`,
      playerId,
      targetPlayerId,
      timestamp: new Date()
    };
  }

  /**
   * Obtiene el estado actual de la Copa del Rey
   * @returns {Object} estado de la copa
   */
  getKingsCupStatus() {
    return {
      kingsCount: this.kingsCount,
      cupContent: this.cupContent,
      isComplete: this.kingsCount >= 4,
      nextAction: this.kingsCount < 4 ? 'Añadir al vaso' : 'Beber todo el vaso'
    };
  }

  /**
   * Obtiene las cartas de venganza disponibles
   * @returns {Array} cartas de venganza
   */
  getVenganzaCards() {
    return this.venganzaCards;
  }

  /**
   * Pasa al siguiente turno
   */
  nextTurn() {
    if (this.status === 'started') {
      this.currentTurn = (this.currentTurn + 1) % this.players.length;
    }
  }

  /**
   * Obtiene el jugador actual
   * @returns {string} ID del jugador actual
   */
  getCurrentPlayer() {
    return this.players[this.currentTurn];
  }

  /**
   * Actualiza las reglas personalizadas
   * @param {Object} newRules 
   */
  updateRules(newRules) {
    this.rules = { ...this.rules, ...newRules };
  }

  /**
   * Termina la partida
   */
  endGame() {
    this.status = 'ended';
    this.endedAt = new Date();
  }

  /**
   * Obtiene estadísticas de la partida
   * @returns {Object} estadísticas
   */
  getStats() {
    const stats = {
      totalCards: this.history.length,
      cardsPerPlayer: {},
      duration: null,
      mostActivePlayer: null
    };

    // Contar cartas por jugador
    this.players.forEach(playerId => {
      stats.cardsPerPlayer[playerId] = this.history.filter(h => h.playerId === playerId).length;
    });

    // Calcular duración
    if (this.startedAt && this.endedAt) {
      stats.duration = this.endedAt - this.startedAt;
    }

    // Jugador más activo
    let maxCards = 0;
    Object.entries(stats.cardsPerPlayer).forEach(([playerId, count]) => {
      if (count > maxCards) {
        maxCards = count;
        stats.mostActivePlayer = playerId;
      }
    });

    return stats;
  }

  /**
   * Verifica si la partida está terminada
   * @returns {boolean}
   */
  isGameOver() {
    return this.status === 'ended' || this.deck.length === 0;
  }

  /**
   * Convierte el juego a objeto para serialización
   * @returns {Object}
   */
  toJSON() {
    return {
      code: this.code,
      host: this.host,
      players: this.players,
      deck: this.deck.map(card => card.toJSON()),
      history: this.history,
      rules: this.rules,
      status: this.status,
      currentTurn: this.currentTurn,
      currentPlayer: this.getCurrentPlayer(),
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      savedCards: this.savedCards,
      cardsRemaining: this.deck.length,
      isGameOver: this.isGameOver(),
      stats: this.status === 'ended' ? this.getStats() : null,
      kingsCount: this.kingsCount,
      cupContent: this.cupContent,
      kingsCupStatus: this.getKingsCupStatus(),
      venganzaCards: this.venganzaCards,
      availableVenganzas: this.venganzaCards.length
    };
  }

  /**
   * Crea un juego desde un objeto
   * @param {Object} gameData 
   * @returns {Game}
   */
  static fromJSON(gameData) {
    const game = new Game(gameData.code, gameData.host);
    
    game.players = gameData.players || [];
    game.deck = (gameData.deck || []).map(cardData => Card.fromJSON(cardData));
    game.history = gameData.history || [];
    game.rules = gameData.rules || game._getDefaultRules();
    game.status = gameData.status || 'waiting';
    game.currentTurn = gameData.currentTurn || 0;
    game.createdAt = gameData.createdAt ? new Date(gameData.createdAt) : new Date();
    game.startedAt = gameData.startedAt ? new Date(gameData.startedAt) : null;
    game.endedAt = gameData.endedAt ? new Date(gameData.endedAt) : null;
    game.savedCards = gameData.savedCards || {};
    game.kingsCount = gameData.kingsCount || 0;
    game.cupContent = gameData.cupContent || [];
    game.venganzaCards = gameData.venganzaCards || [];

    return game;
  }
}

module.exports = Game;
