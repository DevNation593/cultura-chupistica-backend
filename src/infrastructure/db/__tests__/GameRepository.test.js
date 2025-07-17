const GameRepository = require('../GameRepository');
const GameModel = require('../GameModel');
const Game = require('../../../domain/models/Game');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

describe('GameRepository', () => {
  let mongoServer;
  let gameRepository;

  beforeAll(async () => {
    // Configurar servidor MongoDB en memoria para tests
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    gameRepository = new GameRepository();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Limpiar base de datos antes de cada test
    await GameModel.deleteMany({});
  });

  describe('create', () => {
    it('should create a new game successfully', async () => {
      // Arrange
      const gameData = {
        code: 'TEST01',
        host: 'player1',
        players: ['player1']
      };
      const game = new Game(gameData);

      // Act
      const createdGame = await gameRepository.create(game);

      // Assert
      expect(createdGame).toBeDefined();
      expect(createdGame.code).toBe('TEST01');
      expect(createdGame.host).toBe('player1');
      expect(createdGame.players).toContain('player1');
      expect(createdGame.status).toBe('waiting');
    });

    it('should throw error for duplicate game code', async () => {
      // Arrange
      const gameData = {
        code: 'DUPLICATE',
        host: 'player1',
        players: ['player1']
      };
      const game1 = new Game(gameData);
      const game2 = new Game(gameData);

      // Act & Assert
      await gameRepository.create(game1);
      await expect(gameRepository.create(game2)).rejects.toThrow('El código de partida ya existe');
    });
  });

  describe('findByCode', () => {
    it('should find game by code', async () => {
      // Arrange
      const gameData = {
        code: 'FIND01',
        host: 'player1',
        players: ['player1']
      };
      const game = new Game(gameData);
      await gameRepository.create(game);

      // Act
      const foundGame = await gameRepository.findByCode('FIND01');

      // Assert
      expect(foundGame).toBeDefined();
      expect(foundGame.code).toBe('FIND01');
      expect(foundGame.host).toBe('player1');
    });

    it('should return null for non-existent game', async () => {
      // Act
      const foundGame = await gameRepository.findByCode('NONEXISTENT');

      // Assert
      expect(foundGame).toBeNull();
    });

    it('should find game with case-insensitive code', async () => {
      // Arrange
      const gameData = {
        code: 'CASE01',
        host: 'player1',
        players: ['player1']
      };
      const game = new Game(gameData);
      await gameRepository.create(game);

      // Act
      const foundGame = await gameRepository.findByCode('case01');

      // Assert
      expect(foundGame).toBeDefined();
      expect(foundGame.code).toBe('CASE01');
    });
  });

  describe('update', () => {
    it('should update game successfully', async () => {
      // Arrange
      const gameData = {
        code: 'UPDATE01',
        host: 'player1',
        players: ['player1']
      };
      const game = new Game(gameData);
      const createdGame = await gameRepository.create(game);

      // Modify game
      createdGame.addPlayer('player2');
      createdGame.start();

      // Act
      const updatedGame = await gameRepository.update(createdGame);

      // Assert
      expect(updatedGame.players).toContain('player2');
      expect(updatedGame.status).toBe('started');
    });

    it('should throw error for non-existent game', async () => {
      // Arrange
      const gameData = {
        code: 'NONEXISTENT',
        host: 'player1',
        players: ['player1']
      };
      const game = new Game(gameData);

      // Act & Assert
      await expect(gameRepository.update(game)).rejects.toThrow('Partida no encontrada');
    });
  });

  describe('delete', () => {
    it('should delete game successfully', async () => {
      // Arrange
      const gameData = {
        code: 'DELETE01',
        host: 'player1',
        players: ['player1']
      };
      const game = new Game(gameData);
      await gameRepository.create(game);

      // Act
      const deleted = await gameRepository.delete('DELETE01');

      // Assert
      expect(deleted).toBe(true);
      
      // Verify game is deleted
      const foundGame = await gameRepository.findByCode('DELETE01');
      expect(foundGame).toBeNull();
    });

    it('should return false for non-existent game', async () => {
      // Act
      const deleted = await gameRepository.delete('NONEXISTENT');

      // Assert
      expect(deleted).toBe(false);
    });
  });

  describe('getActiveGames', () => {
    it('should return active games with pagination', async () => {
      // Arrange
      const games = [];
      for (let i = 1; i <= 5; i++) {
        const gameData = {
          code: `ACTIVE${i.toString().padStart(2, '0')}`,
          host: `player${i}`,
          players: [`player${i}`]
        };
        const game = new Game(gameData);
        if (i <= 3) {
          game.start(); // Make some games started
        }
        games.push(game);
        await gameRepository.create(game);
      }

      // Act
      const result = await gameRepository.getActiveGames(3, 0);

      // Assert
      expect(result.games).toHaveLength(3);
      expect(result.pagination.total).toBe(5);
      expect(result.pagination.hasMore).toBe(true);
    });

    it('should not return ended games', async () => {
      // Arrange
      const gameData = {
        code: 'ENDED01',
        host: 'player1',
        players: ['player1']
      };
      const game = new Game(gameData);
      game.start();
      game.end();
      await gameRepository.create(game);

      // Act
      const result = await gameRepository.getActiveGames();

      // Assert
      expect(result.games).toHaveLength(0);
    });
  });

  describe('getGamesByPlayer', () => {
    it('should return games for specific player', async () => {
      // Arrange
      const games = [
        { code: 'PLAYER01', host: 'player1', players: ['player1', 'player2'] },
        { code: 'PLAYER02', host: 'player2', players: ['player2', 'player3'] },
        { code: 'PLAYER03', host: 'player1', players: ['player1', 'player3'] }
      ];

      for (const gameData of games) {
        const game = new Game(gameData);
        await gameRepository.create(game);
      }

      // Act
      const result = await gameRepository.getGamesByPlayer('player1');

      // Assert
      expect(result.games).toHaveLength(2);
      expect(result.games.every(g => g.players.includes('player1'))).toBe(true);
    });
  });

  describe('findByStatus', () => {
    it('should return games with specific status', async () => {
      // Arrange
      const games = [
        { code: 'STATUS01', host: 'player1', players: ['player1'] },
        { code: 'STATUS02', host: 'player2', players: ['player2'] },
        { code: 'STATUS03', host: 'player3', players: ['player3'] }
      ];

      for (let i = 0; i < games.length; i++) {
        const game = new Game(games[i]);
        if (i < 2) {
          game.start();
        }
        await gameRepository.create(game);
      }

      // Act
      const result = await gameRepository.findByStatus('started');

      // Assert
      expect(result.games).toHaveLength(2);
      expect(result.games.every(g => g.status === 'started')).toBe(true);
    });
  });

  describe('exists', () => {
    it('should return true for existing game', async () => {
      // Arrange
      const gameData = {
        code: 'EXISTS01',
        host: 'player1',
        players: ['player1']
      };
      const game = new Game(gameData);
      await gameRepository.create(game);

      // Act
      const exists = await gameRepository.exists('EXISTS01');

      // Assert
      expect(exists).toBe(true);
    });

    it('should return false for non-existent game', async () => {
      // Act
      const exists = await gameRepository.exists('NONEXISTENT');

      // Assert
      expect(exists).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return database statistics', async () => {
      // Arrange
      const games = [
        { code: 'STAT01', host: 'player1', players: ['player1'] },
        { code: 'STAT02', host: 'player2', players: ['player2'] }
      ];

      for (let i = 0; i < games.length; i++) {
        const game = new Game(games[i]);
        if (i === 0) {
          game.start();
        }
        await gameRepository.create(game);
      }

      // Act
      const stats = await gameRepository.getStats();

      // Assert
      expect(stats).toBeDefined();
      expect(stats.totalGames).toBe(2);
      expect(stats.activeGames).toBe(2);
      expect(stats.endedGames).toBe(0);
    });
  });

  describe('_documentToGame and _gameToDocument', () => {
    it('should convert between document and game correctly', async () => {
      // Arrange
      const gameData = {
        code: 'CONVERT01',
        host: 'player1',
        players: ['player1', 'player2'],
        status: 'started',
        currentTurn: 1,
        kingsCount: 2,
        cupContent: [
          { playerId: 'player1', kingNumber: 1, timestamp: new Date() }
        ],
        venganzaCards: [
          { playerId: 'player2', card: { id: 'AS', rank: 'A', suit: 'spades' }, timestamp: new Date() }
        ]
      };
      const game = new Game(gameData);

      // Act
      const createdGame = await gameRepository.create(game);
      const foundGame = await gameRepository.findByCode('CONVERT01');

      // Assert
      expect(foundGame).toBeDefined();
      expect(foundGame.code).toBe(game.code);
      expect(foundGame.host).toBe(game.host);
      expect(foundGame.players).toEqual(game.players);
      expect(foundGame.status).toBe(game.status);
      expect(foundGame.currentTurn).toBe(game.currentTurn);
      expect(foundGame.kingsCount).toBe(game.kingsCount);
      expect(foundGame.cupContent).toEqual(game.cupContent);
      expect(foundGame.venganzaCards).toEqual(game.venganzaCards);
    });
  });
});
