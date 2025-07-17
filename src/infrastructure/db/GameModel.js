const mongoose = require('mongoose');

/**
 * Esquema de MongoDB para las partidas
 */
const gameSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true,
    uppercase: true,
    trim: true
  },
  host: {
    type: String,
    required: true,
    trim: true
  },
  players: [{
    type: String,
    required: true,
    trim: true
  }],
  deck: [{
    id: String,
    suit: {
      type: String,
      enum: ['hearts', 'diamonds', 'clubs', 'spades']
    },
    rank: {
      type: String,
      enum: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    },
    value: Number,
    fullName: String,
    isFaceCard: Boolean,
    isAce: Boolean,
    isRed: Boolean,
    isBlack: Boolean
  }],
  history: [{
    card: {
      id: String,
      suit: String,
      rank: String,
      value: Number,
      fullName: String,
      isFaceCard: Boolean,
      isAce: Boolean,
      isRed: Boolean,
      isBlack: Boolean
    },
    playerId: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    rule: String,
    kingsCount: Number,
    isActivated: {
      type: Boolean,
      default: false
    },
    isVenganza: {
      type: Boolean,
      default: false
    },
    targetPlayerId: String
  }],
  rules: {
    type: Map,
    of: String,
    default: {}
  },
  status: {
    type: String,
    enum: ['waiting', 'started', 'ended'],
    default: 'waiting',
    index: true
  },
  currentTurn: {
    type: Number,
    default: 0,
    min: 0
  },
  savedCards: {
    type: Map,
    of: [{
      id: String,
      suit: String,
      rank: String,
      value: Number,
      fullName: String,
      isFaceCard: Boolean,
      isAce: Boolean,
      isRed: Boolean,
      isBlack: Boolean
    }],
    default: {}
  },
  kingsCount: {
    type: Number,
    default: 0,
    min: 0,
    max: 4
  },
  cupContent: [{
    playerId: String,
    kingNumber: {
      type: Number,
      min: 1,
      max: 4
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  venganzaCards: [{
    playerId: String,
    card: {
      id: String,
      suit: String,
      rank: String,
      value: Number,
      fullName: String,
      isFaceCard: Boolean,
      isAce: Boolean,
      isRed: Boolean,
      isBlack: Boolean
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  startedAt: {
    type: Date,
    default: null
  },
  endedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices compuestos para mejorar rendimiento
gameSchema.index({ code: 1, status: 1 });
gameSchema.index({ players: 1, status: 1 });
gameSchema.index({ createdAt: -1, status: 1 });

// Virtual para obtener el jugador actual
gameSchema.virtual('currentPlayer').get(function() {
  if (this.players && this.players.length > 0) {
    return this.players[this.currentTurn] || null;
  }
  return null;
});

// Virtual para obtener cartas restantes
gameSchema.virtual('cardsRemaining').get(function() {
  return this.deck ? this.deck.length : 0;
});

// Virtual para verificar si el juego terminó
gameSchema.virtual('isGameOver').get(function() {
  return this.status === 'ended' || this.cardsRemaining === 0;
});

// Virtual para contar venganzas disponibles
gameSchema.virtual('availableVenganzas').get(function() {
  return this.venganzaCards ? this.venganzaCards.length : 0;
});

// Middleware pre-save para validaciones
gameSchema.pre('save', function(next) {
  // Validar que el host esté en la lista de jugadores
  if (!this.players.includes(this.host)) {
    return next(new Error('El host debe estar en la lista de jugadores'));
  }

  // Validar que el turno actual sea válido
  if (this.currentTurn >= this.players.length) {
    this.currentTurn = 0;
  }

  // Validar límite de jugadores
  if (this.players.length > 8) {
    return next(new Error('Máximo 8 jugadores permitidos'));
  }

  // Validar que no haya jugadores duplicados
  const uniquePlayers = [...new Set(this.players)];
  if (uniquePlayers.length !== this.players.length) {
    return next(new Error('No se permiten jugadores duplicados'));
  }

  next();
});

// Middleware post-save para logging
gameSchema.post('save', function(doc) {
  console.log(`Partida ${doc.code} guardada - Estado: ${doc.status}`);
});

// Método para limpiar partidas antigas
gameSchema.statics.cleanupOldGames = async function(daysOld = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await this.deleteMany({
    $or: [
      { status: 'ended', endedAt: { $lt: cutoffDate } },
      { status: 'waiting', createdAt: { $lt: cutoffDate } }
    ]
  });

  console.log(`Limpieza completada: ${result.deletedCount} partidas eliminadas`);
  return result;
};

// Método para obtener estadísticas globales
gameSchema.statics.getGlobalStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const totalGames = await this.countDocuments();
  const activeGames = await this.countDocuments({ status: { $in: ['waiting', 'started'] } });
  const endedGames = await this.countDocuments({ status: 'ended' });

  return {
    totalGames,
    activeGames,
    endedGames,
    statusBreakdown: stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {})
  };
};

const GameModel = mongoose.model('Game', gameSchema);

module.exports = GameModel;
