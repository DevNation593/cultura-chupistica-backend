/**
 * Servicio de dominio para calcular estadísticas y métricas del juego
 */
class GameStatsService {
  /**
   * Calcula estadísticas básicas de una partida
   * @param {Object} game - Partida
   * @returns {Object} Estadísticas básicas
   */
  static calculateBasicStats(game) {
    const stats = {
      gameCode: game.code,
      status: game.status,
      playerCount: game.players.length,
      currentTurn: game.currentTurn,
      currentPlayer: game.players[game.currentTurn] || null,
      cardsRemaining: game.deck.length,
      cardsDrawn: game.history.length,
      kingsCount: game.kingsCount,
      venganzasAvailable: game.venganzaCards.length,
      gameProgress: this.calculateGameProgress(game),
      duration: this.calculateGameDuration(game),
      isGameNearEnd: this.isGameNearEnd(game)
    };

    return stats;
  }

  /**
   * Calcula estadísticas detalladas de una partida
   * @param {Object} game - Partida
   * @returns {Object} Estadísticas detalladas
   */
  static calculateDetailedStats(game) {
    const basicStats = this.calculateBasicStats(game);
    
    const detailedStats = {
      ...basicStats,
      players: this.calculatePlayerStats(game),
      cards: this.calculateCardStats(game),
      turns: this.calculateTurnStats(game),
      rules: this.calculateRuleStats(game),
      venganzas: this.calculateVenganzaStats(game),
      kings: this.calculateKingStats(game),
      timeline: this.calculateTimelineStats(game)
    };

    return detailedStats;
  }

  /**
   * Calcula el progreso del juego
   * @param {Object} game - Partida
   * @returns {number} Progreso en porcentaje (0-100)
   */
  static calculateGameProgress(game) {
    if (game.status === 'waiting') return 0;
    if (game.status === 'ended') return 100;
    
    const totalCards = 52;
    const cardsDrawn = game.history.length;
    return Math.round((cardsDrawn / totalCards) * 100);
  }

  /**
   * Calcula la duración del juego
   * @param {Object} game - Partida
   * @returns {Object} Duración en diferentes formatos
   */
  static calculateGameDuration(game) {
    if (!game.startedAt) {
      return {
        milliseconds: 0,
        seconds: 0,
        minutes: 0,
        hours: 0,
        formatted: '00:00:00'
      };
    }

    const endTime = game.endedAt || new Date();
    const startTime = game.startedAt;
    const duration = endTime.getTime() - startTime.getTime();

    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);

    return {
      milliseconds: duration,
      seconds: Math.floor(duration / 1000),
      minutes: Math.floor(duration / (1000 * 60)),
      hours,
      formatted: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    };
  }

  /**
   * Determina si el juego está cerca del final
   * @param {Object} game - Partida
   * @returns {boolean} True si está cerca del final
   */
  static isGameNearEnd(game) {
    const progress = this.calculateGameProgress(game);
    return progress >= 80 || game.deck.length <= 10 || game.kingsCount >= 3;
  }

  /**
   * Calcula estadísticas por jugador
   * @param {Object} game - Partida
   * @returns {Array} Estadísticas por jugador
   */
  static calculatePlayerStats(game) {
    const playerStats = [];

    for (const playerId of game.players) {
      const playerCards = game.history.filter(h => h.playerId === playerId);
      const playerVenganzas = game.venganzaCards.filter(v => v.playerId === playerId);
      const playerSavedCards = game.savedCards[playerId] || [];

      const stats = {
        playerId,
        isHost: playerId === game.host,
        isCurrentTurn: game.players[game.currentTurn] === playerId,
        cardsDrawn: playerCards.length,
        cardsActivated: playerCards.filter(h => h.isActivated).length,
        venganzasEarned: playerVenganzas.length,
        cardsSaved: playerSavedCards.length,
        kingsDrawn: playerCards.filter(h => h.card.rank === 'K').length,
        acesDrawn: playerCards.filter(h => h.card.rank === 'A').length,
        faceCardsDrawn: playerCards.filter(h => h.card.isFaceCard).length,
        redCardsDrawn: playerCards.filter(h => h.card.isRed).length,
        blackCardsDrawn: playerCards.filter(h => h.card.isBlack).length,
        averageCardValue: this.calculateAverageCardValue(playerCards),
        lastCardDrawn: playerCards.length > 0 ? playerCards[playerCards.length - 1] : null,
        turnOrder: game.players.indexOf(playerId)
      };

      playerStats.push(stats);
    }

    return playerStats;
  }

  /**
   * Calcula estadísticas de cartas
   * @param {Object} game - Partida
   * @returns {Object} Estadísticas de cartas
   */
  static calculateCardStats(game) {
    const drawnCards = game.history.map(h => h.card);
    const remainingCards = game.deck;

    const stats = {
      total: {
        drawn: drawnCards.length,
        remaining: remainingCards.length
      },
      byRank: this.calculateStatsByRank(drawnCards, remainingCards),
      bySuit: this.calculateStatsBySuit(drawnCards, remainingCards),
      byColor: this.calculateStatsByColor(drawnCards, remainingCards),
      special: {
        aces: drawnCards.filter(c => c.rank === 'A').length,
        kings: drawnCards.filter(c => c.rank === 'K').length,
        faceCards: drawnCards.filter(c => c.isFaceCard).length,
        saveableCards: drawnCards.filter(c => ['A', '5', '9'].includes(c.rank)).length
      }
    };

    return stats;
  }

  /**
   * Calcula estadísticas por valor de carta
   * @param {Array} drawnCards - Cartas robadas
   * @param {Array} remainingCards - Cartas restantes
   * @returns {Object} Estadísticas por valor
   */
  static calculateStatsByRank(drawnCards, remainingCards) {
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const stats = {};

    for (const rank of ranks) {
      const drawn = drawnCards.filter(c => c.rank === rank).length;
      const remaining = remainingCards.filter(c => c.rank === rank).length;
      const total = 4; // Siempre hay 4 cartas de cada valor

      stats[rank] = {
        drawn,
        remaining,
        total,
        percentage: Math.round((drawn / total) * 100)
      };
    }

    return stats;
  }

  /**
   * Calcula estadísticas por palo
   * @param {Array} drawnCards - Cartas robadas
   * @param {Array} remainingCards - Cartas restantes
   * @returns {Object} Estadísticas por palo
   */
  static calculateStatsBySuit(drawnCards, remainingCards) {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const stats = {};

    for (const suit of suits) {
      const drawn = drawnCards.filter(c => c.suit === suit).length;
      const remaining = remainingCards.filter(c => c.suit === suit).length;
      const total = 13; // Siempre hay 13 cartas de cada palo

      stats[suit] = {
        drawn,
        remaining,
        total,
        percentage: Math.round((drawn / total) * 100)
      };
    }

    return stats;
  }

  /**
   * Calcula estadísticas por color
   * @param {Array} drawnCards - Cartas robadas
   * @param {Array} remainingCards - Cartas restantes
   * @returns {Object} Estadísticas por color
   */
  static calculateStatsByColor(drawnCards, remainingCards) {
    const redDrawn = drawnCards.filter(c => c.isRed).length;
    const blackDrawn = drawnCards.filter(c => c.isBlack).length;
    const redRemaining = remainingCards.filter(c => c.isRed).length;
    const blackRemaining = remainingCards.filter(c => c.isBlack).length;

    return {
      red: {
        drawn: redDrawn,
        remaining: redRemaining,
        total: 26,
        percentage: Math.round((redDrawn / 26) * 100)
      },
      black: {
        drawn: blackDrawn,
        remaining: blackRemaining,
        total: 26,
        percentage: Math.round((blackDrawn / 26) * 100)
      }
    };
  }

  /**
   * Calcula estadísticas de turnos
   * @param {Object} game - Partida
   * @returns {Object} Estadísticas de turnos
   */
  static calculateTurnStats(game) {
    const totalTurns = game.history.length;
    const turnsPerPlayer = {};

    // Inicializar contadores
    for (const playerId of game.players) {
      turnsPerPlayer[playerId] = 0;
    }

    // Contar turnos por jugador
    for (const historyItem of game.history) {
      turnsPerPlayer[historyItem.playerId]++;
    }

    const stats = {
      totalTurns,
      currentTurn: game.currentTurn,
      turnsPerPlayer,
      averageTurnsPerPlayer: totalTurns > 0 ? Math.round(totalTurns / game.players.length) : 0,
      longestStreak: this.calculateLongestStreak(game.history),
      turnDistribution: this.calculateTurnDistribution(turnsPerPlayer)
    };

    return stats;
  }

  /**
   * Calcula estadísticas de reglas aplicadas
   * @param {Object} game - Partida
   * @returns {Object} Estadísticas de reglas
   */
  static calculateRuleStats(game) {
    const ruleApplications = {};
    const customRules = game.rules || {};

    // Contar aplicaciones de reglas
    for (const historyItem of game.history) {
      const rule = historyItem.rule;
      if (rule) {
        ruleApplications[rule] = (ruleApplications[rule] || 0) + 1;
      }
    }

    const stats = {
      customRules,
      ruleApplications,
      totalRuleApplications: Object.values(ruleApplications).reduce((sum, count) => sum + count, 0),
      mostUsedRule: this.findMostUsedRule(ruleApplications),
      ruleEfficiency: this.calculateRuleEfficiency(game.history)
    };

    return stats;
  }

  /**
   * Calcula estadísticas de venganzas
   * @param {Object} game - Partida
   * @returns {Object} Estadísticas de venganzas
   */
  static calculateVenganzaStats(game) {
    const venganzasByPlayer = {};
    const venganzaUsage = {};

    // Agrupar venganzas por jugador
    for (const venganza of game.venganzaCards) {
      venganzasByPlayer[venganza.playerId] = (venganzasByPlayer[venganza.playerId] || 0) + 1;
    }

    // Contar uso de venganzas en historial
    for (const historyItem of game.history) {
      if (historyItem.isVenganza) {
        venganzaUsage[historyItem.playerId] = (venganzaUsage[historyItem.playerId] || 0) + 1;
      }
    }

    const stats = {
      totalVenganzas: game.venganzaCards.length,
      venganzasByPlayer,
      venganzaUsage,
      venganzaEfficiency: this.calculateVenganzaEfficiency(venganzasByPlayer, venganzaUsage),
      averageVenganzasPerPlayer: game.players.length > 0 ? Math.round(game.venganzaCards.length / game.players.length) : 0
    };

    return stats;
  }

  /**
   * Calcula estadísticas de reyes
   * @param {Object} game - Partida
   * @returns {Object} Estadísticas de reyes
   */
  static calculateKingStats(game) {
    const kingHistory = game.history.filter(h => h.card.rank === 'K');
    const cupContent = game.cupContent || [];

    const stats = {
      kingsDrawn: kingHistory.length,
      kingsRemaining: 4 - kingHistory.length,
      currentKingCount: game.kingsCount,
      cupContent: cupContent.length,
      kingsByPlayer: this.calculateKingsByPlayer(kingHistory),
      timeToNextKing: this.estimateTimeToNextKing(game),
      gameEndRisk: this.calculateGameEndRisk(game.kingsCount)
    };

    return stats;
  }

  /**
   * Calcula estadísticas de línea de tiempo
   * @param {Object} game - Partida
   * @returns {Object} Estadísticas de línea de tiempo
   */
  static calculateTimelineStats(game) {
    const stats = {
      gameStart: game.startedAt,
      gameEnd: game.endedAt,
      duration: this.calculateGameDuration(game),
      milestones: this.calculateGameMilestones(game),
      pace: this.calculateGamePace(game),
      timeline: this.createTimeline(game.history)
    };

    return stats;
  }

  /**
   * Calcula valor promedio de cartas de un jugador
   * @param {Array} playerCards - Cartas del jugador
   * @returns {number} Valor promedio
   */
  static calculateAverageCardValue(playerCards) {
    if (playerCards.length === 0) return 0;
    
    const totalValue = playerCards.reduce((sum, historyItem) => sum + historyItem.card.value, 0);
    return Math.round((totalValue / playerCards.length) * 100) / 100;
  }

  /**
   * Encuentra la racha más larga de un jugador
   * @param {Array} history - Historial de cartas
   * @returns {Object} Información de la racha más larga
   */
  static calculateLongestStreak(history) {
    if (history.length === 0) return { player: null, length: 0 };

    let longestStreak = { player: null, length: 0 };
    let currentStreak = { player: history[0].playerId, length: 1 };

    for (let i = 1; i < history.length; i++) {
      if (history[i].playerId === currentStreak.player) {
        currentStreak.length++;
      } else {
        if (currentStreak.length > longestStreak.length) {
          longestStreak = { ...currentStreak };
        }
        currentStreak = { player: history[i].playerId, length: 1 };
      }
    }

    if (currentStreak.length > longestStreak.length) {
      longestStreak = { ...currentStreak };
    }

    return longestStreak;
  }

  /**
   * Calcula distribución de turnos
   * @param {Object} turnsPerPlayer - Turnos por jugador
   * @returns {Object} Distribución de turnos
   */
  static calculateTurnDistribution(turnsPerPlayer) {
    const values = Object.values(turnsPerPlayer);
    const total = values.reduce((sum, count) => sum + count, 0);

    if (total === 0) return { min: 0, max: 0, average: 0, variance: 0 };

    const min = Math.min(...values);
    const max = Math.max(...values);
    const average = total / values.length;
    const variance = values.reduce((sum, count) => sum + Math.pow(count - average, 2), 0) / values.length;

    return { min, max, average: Math.round(average), variance: Math.round(variance) };
  }

  /**
   * Encuentra la regla más usada
   * @param {Object} ruleApplications - Aplicaciones de reglas
   * @returns {Object} Regla más usada
   */
  static findMostUsedRule(ruleApplications) {
    if (Object.keys(ruleApplications).length === 0) return null;

    const entries = Object.entries(ruleApplications);
    const mostUsed = entries.reduce((prev, current) => current[1] > prev[1] ? current : prev);

    return {
      rule: mostUsed[0],
      count: mostUsed[1]
    };
  }

  /**
   * Calcula eficiencia de reglas
   * @param {Array} history - Historial de cartas
   * @returns {number} Eficiencia en porcentaje
   */
  static calculateRuleEfficiency(history) {
    if (history.length === 0) return 0;

    const cardsWithRules = history.filter(h => h.rule).length;
    return Math.round((cardsWithRules / history.length) * 100);
  }

  /**
   * Calcula eficiencia de venganzas
   * @param {Object} venganzasByPlayer - Venganzas por jugador
   * @param {Object} venganzaUsage - Uso de venganzas
   * @returns {number} Eficiencia en porcentaje
   */
  static calculateVenganzaEfficiency(venganzasByPlayer, venganzaUsage) {
    const totalVenganzas = Object.values(venganzasByPlayer).reduce((sum, count) => sum + count, 0);
    const totalUsage = Object.values(venganzaUsage).reduce((sum, count) => sum + count, 0);

    if (totalVenganzas === 0) return 0;
    return Math.round((totalUsage / totalVenganzas) * 100);
  }

  /**
   * Calcula reyes por jugador
   * @param {Array} kingHistory - Historial de reyes
   * @returns {Object} Reyes por jugador
   */
  static calculateKingsByPlayer(kingHistory) {
    const kingsByPlayer = {};
    
    for (const historyItem of kingHistory) {
      kingsByPlayer[historyItem.playerId] = (kingsByPlayer[historyItem.playerId] || 0) + 1;
    }

    return kingsByPlayer;
  }

  /**
   * Estima tiempo hasta el próximo rey
   * @param {Object} game - Partida
   * @returns {number} Estimación en turnos
   */
  static estimateTimeToNextKing(game) {
    const kingsRemaining = 4 - game.kingsCount;
    const cardsRemaining = game.deck.length;
    
    if (kingsRemaining === 0 || cardsRemaining === 0) return 0;
    
    return Math.round(cardsRemaining / kingsRemaining);
  }

  /**
   * Calcula riesgo de fin de juego
   * @param {number} kingsCount - Número de reyes
   * @returns {string} Nivel de riesgo
   */
  static calculateGameEndRisk(kingsCount) {
    if (kingsCount === 0) return 'low';
    if (kingsCount === 1) return 'low';
    if (kingsCount === 2) return 'medium';
    if (kingsCount === 3) return 'high';
    return 'critical';
  }

  /**
   * Calcula hitos del juego
   * @param {Object} game - Partida
   * @returns {Array} Hitos del juego
   */
  static calculateGameMilestones(game) {
    const milestones = [];

    // Primer carta
    if (game.history.length > 0) {
      milestones.push({
        type: 'first_card',
        timestamp: game.history[0].timestamp,
        description: 'Primera carta robada'
      });
    }

    // Primer rey
    const firstKing = game.history.find(h => h.card.rank === 'K');
    if (firstKing) {
      milestones.push({
        type: 'first_king',
        timestamp: firstKing.timestamp,
        description: 'Primer rey robado'
      });
    }

    // Mitad del juego
    const halfwayPoint = game.history.find((_, index) => index === 25);
    if (halfwayPoint) {
      milestones.push({
        type: 'halfway',
        timestamp: halfwayPoint.timestamp,
        description: 'Mitad del juego'
      });
    }

    return milestones;
  }

  /**
   * Calcula ritmo del juego
   * @param {Object} game - Partida
   * @returns {Object} Ritmo del juego
   */
  static calculateGamePace(game) {
    if (!game.startedAt || game.history.length === 0) {
      return { cardsPerMinute: 0, averageTimeBetweenCards: 0 };
    }

    const duration = this.calculateGameDuration(game);
    const cardsPerMinute = duration.minutes > 0 ? Math.round(game.history.length / duration.minutes) : 0;
    const averageTimeBetweenCards = duration.minutes > 0 ? Math.round(duration.minutes / game.history.length) : 0;

    return { cardsPerMinute, averageTimeBetweenCards };
  }

  /**
   * Crea línea de tiempo del juego
   * @param {Array} history - Historial de cartas
   * @returns {Array} Línea de tiempo
   */
  static createTimeline(history) {
    return history.map((historyItem, index) => ({
      turn: index + 1,
      timestamp: historyItem.timestamp,
      playerId: historyItem.playerId,
      card: historyItem.card,
      rule: historyItem.rule,
      isSpecial: historyItem.card.rank === 'K' || historyItem.card.rank === 'A' || historyItem.isVenganza
    }));
  }
}

module.exports = GameStatsService;
