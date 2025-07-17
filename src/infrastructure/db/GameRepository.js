const GameModel = require('./GameModel');
const Game = require('../../domain/models/Game');

/**
 * Repositorio para la gestión de partidas en MongoDB
 */
class GameRepository {
  
  /**
   * Crear una nueva partida
   * @param {Game} game - Instancia del juego
   * @returns {Promise<Game>} Juego creado
   */
  async create(game) {
    try {
      const gameData = this._gameToDocument(game);
      const document = new GameModel(gameData);
      const savedDoc = await document.save();
      return this._documentToGame(savedDoc);
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('El código de partida ya existe');
      }
      throw new Error(`Error al crear la partida: ${error.message}`);
    }
  }

  /**
   * Buscar partida por código
   * @param {string} code - Código de la partida
   * @returns {Promise<Game|null>} Juego encontrado o null
   */
  async findByCode(code) {
    try {
      const document = await GameModel.findOne({ code: code.toUpperCase() });
      return document ? this._documentToGame(document) : null;
    } catch (error) {
      throw new Error(`Error al buscar partida: ${error.message}`);
    }
  }

  /**
   * Actualizar una partida existente
   * @param {Game} game - Instancia del juego actualizada
   * @returns {Promise<Game>} Juego actualizado
   */
  async update(game) {
    try {
      const gameData = this._gameToDocument(game);
      const document = await GameModel.findOneAndUpdate(
        { code: game.code },
        gameData,
        { new: true, runValidators: true }
      );
      
      if (!document) {
        throw new Error('Partida no encontrada');
      }
      
      return this._documentToGame(document);
    } catch (error) {
      throw new Error(`Error al actualizar partida: ${error.message}`);
    }
  }

  /**
   * Eliminar partida por código
   * @param {string} code - Código de la partida
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  async delete(code) {
    try {
      const result = await GameModel.deleteOne({ code: code.toUpperCase() });
      return result.deletedCount > 0;
    } catch (error) {
      throw new Error(`Error al eliminar partida: ${error.message}`);
    }
  }

  /**
   * Obtener partidas activas con paginación
   * @param {number} limit - Límite de resultados
   * @param {number} offset - Offset para paginación
   * @returns {Promise<Object>} Objeto con partidas y metadatos
   */
  async getActiveGames(limit = 50, offset = 0) {
    try {
      const query = { status: { $in: ['waiting', 'started'] } };
      
      const [games, total] = await Promise.all([
        GameModel.find(query)
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(offset)
          .lean(),
        GameModel.countDocuments(query)
      ]);

      return {
        games: games.map(doc => this._documentToGame(doc)),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener partidas activas: ${error.message}`);
    }
  }

  /**
   * Obtener partidas por jugador
   * @param {string} playerId - ID del jugador
   * @param {number} limit - Límite de resultados
   * @param {number} offset - Offset para paginación
   * @returns {Promise<Object>} Objeto con partidas y metadatos
   */
  async getGamesByPlayer(playerId, limit = 50, offset = 0) {
    try {
      const query = { players: playerId };
      
      const [games, total] = await Promise.all([
        GameModel.find(query)
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(offset)
          .lean(),
        GameModel.countDocuments(query)
      ]);

      return {
        games: games.map(doc => this._documentToGame(doc)),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener partidas del jugador: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de la base de datos
   * @returns {Promise<Object>} Estadísticas globales
   */
  async getStats() {
    try {
      return await GameModel.getGlobalStats();
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Limpiar partidas antiguas
   * @param {number} daysOld - Días de antigüedad
   * @returns {Promise<number>} Número de partidas eliminadas
   */
  async cleanupOldGames(daysOld = 7) {
    try {
      const result = await GameModel.cleanupOldGames(daysOld);
      return result.deletedCount;
    } catch (error) {
      throw new Error(`Error al limpiar partidas: ${error.message}`);
    }
  }

  /**
   * Buscar partidas por estado
   * @param {string} status - Estado de las partidas
   * @param {number} limit - Límite de resultados
   * @param {number} offset - Offset para paginación
   * @returns {Promise<Object>} Objeto con partidas y metadatos
   */
  async findByStatus(status, limit = 50, offset = 0) {
    try {
      const query = { status };
      
      const [games, total] = await Promise.all([
        GameModel.find(query)
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(offset)
          .lean(),
        GameModel.countDocuments(query)
      ]);

      return {
        games: games.map(doc => this._documentToGame(doc)),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      };
    } catch (error) {
      throw new Error(`Error al buscar partidas por estado: ${error.message}`);
    }
  }

  /**
   * Verificar si existe una partida
   * @param {string} code - Código de la partida
   * @returns {Promise<boolean>} True si existe
   */
  async exists(code) {
    try {
      const count = await GameModel.countDocuments({ code: code.toUpperCase() });
      return count > 0;
    } catch (error) {
      throw new Error(`Error al verificar existencia: ${error.message}`);
    }
  }

  /**
   * Convertir documento de MongoDB a instancia de Game
   * @param {Object} document - Documento de MongoDB
   * @returns {Game} Instancia de Game
   * @private
   */
  _documentToGame(document) {
    const doc = document.toObject ? document.toObject() : document;
    
    // Convertir Map a Object si es necesario
    const rules = doc.rules instanceof Map ? Object.fromEntries(doc.rules) : doc.rules;
    const savedCards = doc.savedCards instanceof Map ? Object.fromEntries(doc.savedCards) : doc.savedCards;
    
    return new Game({
      code: doc.code,
      host: doc.host,
      players: doc.players,
      deck: doc.deck,
      history: doc.history,
      rules: rules,
      status: doc.status,
      currentTurn: doc.currentTurn,
      savedCards: savedCards,
      kingsCount: doc.kingsCount,
      cupContent: doc.cupContent,
      venganzaCards: doc.venganzaCards,
      createdAt: doc.createdAt,
      startedAt: doc.startedAt,
      endedAt: doc.endedAt
    });
  }

  /**
   * Convertir instancia de Game a documento de MongoDB
   * @param {Game} game - Instancia de Game
   * @returns {Object} Documento para MongoDB
   * @private
   */
  _gameToDocument(game) {
    return {
      code: game.code,
      host: game.host,
      players: game.players,
      deck: game.deck,
      history: game.history,
      rules: game.rules,
      status: game.status,
      currentTurn: game.currentTurn,
      savedCards: game.savedCards,
      kingsCount: game.kingsCount,
      cupContent: game.cupContent,
      venganzaCards: game.venganzaCards,
      createdAt: game.createdAt,
      startedAt: game.startedAt,
      endedAt: game.endedAt
    };
  }
}

module.exports = GameRepository;
