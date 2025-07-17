const GameEventService = require('../GameEventService');

describe('GameEventService', () => {
  describe('createEvent', () => {
    it('should create a valid event', () => {
      const event = GameEventService.createEvent(
        GameEventService.EVENT_TYPES.GAME_CREATED,
        'TEST01',
        'player1',
        { test: 'data' }
      );

      expect(event).toBeDefined();
      expect(event.id).toBeDefined();
      expect(event.type).toBe(GameEventService.EVENT_TYPES.GAME_CREATED);
      expect(event.gameCode).toBe('TEST01');
      expect(event.playerId).toBe('player1');
      expect(event.data.test).toBe('data');
      expect(event.timestamp).toBeInstanceOf(Date);
    });

    it('should generate unique event IDs', () => {
      const event1 = GameEventService.createEvent(
        GameEventService.EVENT_TYPES.GAME_CREATED,
        'TEST01',
        'player1'
      );
      const event2 = GameEventService.createEvent(
        GameEventService.EVENT_TYPES.GAME_CREATED,
        'TEST02',
        'player2'
      );

      expect(event1.id).not.toBe(event2.id);
    });
  });

  describe('isValidEvent', () => {
    it('should validate correct event', () => {
      const event = GameEventService.createEvent(
        GameEventService.EVENT_TYPES.GAME_CREATED,
        'TEST01',
        'player1'
      );

      expect(GameEventService.isValidEvent(event)).toBe(true);
    });

    it('should reject invalid event', () => {
      const invalidEvent = {
        id: 'test',
        type: 'invalid_type',
        gameCode: 'TEST01'
      };

      expect(GameEventService.isValidEvent(invalidEvent)).toBe(false);
    });

    it('should reject event without required fields', () => {
      const incompleteEvent = {
        id: 'test',
        type: GameEventService.EVENT_TYPES.GAME_CREATED
      };

      expect(GameEventService.isValidEvent(incompleteEvent)).toBe(false);
    });
  });

  describe('specialized event creators', () => {
    it('should create game created event', () => {
      const event = GameEventService.createGameCreatedEvent('TEST01', 'host1');

      expect(event.type).toBe(GameEventService.EVENT_TYPES.GAME_CREATED);
      expect(event.gameCode).toBe('TEST01');
      expect(event.playerId).toBe('host1');
      expect(event.data.host).toBe('host1');
    });

    it('should create player joined event', () => {
      const event = GameEventService.createPlayerJoinedEvent('TEST01', 'player2', 2);

      expect(event.type).toBe(GameEventService.EVENT_TYPES.PLAYER_JOINED);
      expect(event.gameCode).toBe('TEST01');
      expect(event.playerId).toBe('player2');
      expect(event.data.newPlayer).toBe('player2');
      expect(event.data.playerCount).toBe(2);
    });

    it('should create card drawn event', () => {
      const card = { id: 'AS', suit: 'spades', rank: 'A' };
      const event = GameEventService.createCardDrawnEvent('TEST01', 'player1', card, 51);

      expect(event.type).toBe(GameEventService.EVENT_TYPES.CARD_DRAWN);
      expect(event.gameCode).toBe('TEST01');
      expect(event.playerId).toBe('player1');
      expect(event.data.card).toEqual(card);
      expect(event.data.cardsRemaining).toBe(51);
    });

    it('should create venganza used event', () => {
      const venganzaCard = { id: 'AH', suit: 'hearts', rank: 'A' };
      const event = GameEventService.createVenganzaUsedEvent('TEST01', 'player1', 'player2', venganzaCard);

      expect(event.type).toBe(GameEventService.EVENT_TYPES.VENGANZA_USED);
      expect(event.gameCode).toBe('TEST01');
      expect(event.playerId).toBe('player1');
      expect(event.data.targetPlayerId).toBe('player2');
      expect(event.data.venganzaCard).toEqual(venganzaCard);
    });
  });

  describe('eventToJSON and eventFromJSON', () => {
    it('should convert event to JSON and back', () => {
      const originalEvent = GameEventService.createEvent(
        GameEventService.EVENT_TYPES.GAME_CREATED,
        'TEST01',
        'player1',
        { test: 'data' }
      );

      const jsonEvent = GameEventService.eventToJSON(originalEvent);
      const reconstructedEvent = GameEventService.eventFromJSON(jsonEvent);

      expect(reconstructedEvent.id).toBe(originalEvent.id);
      expect(reconstructedEvent.type).toBe(originalEvent.type);
      expect(reconstructedEvent.gameCode).toBe(originalEvent.gameCode);
      expect(reconstructedEvent.playerId).toBe(originalEvent.playerId);
      expect(reconstructedEvent.data).toEqual(originalEvent.data);
      expect(reconstructedEvent.timestamp).toEqual(originalEvent.timestamp);
    });
  });
});
