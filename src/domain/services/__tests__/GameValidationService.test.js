const GameValidationService = require('../GameValidationService');

describe('GameValidationService', () => {
  describe('validateGameCode', () => {
    it('should validate correct game code', () => {
      const result = GameValidationService.validateGameCode('TEST01');

      expect(result.isValid).toBe(true);
      expect(result.errorCode).toBeNull();
      expect(result.message).toBeNull();
    });

    it('should reject empty game code', () => {
      const result = GameValidationService.validateGameCode('');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(GameValidationService.ERROR_CODES.INVALID_GAME_CODE);
      expect(result.message).toBe('Código de partida es requerido');
    });

    it('should reject too short game code', () => {
      const result = GameValidationService.validateGameCode('AB');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(GameValidationService.ERROR_CODES.INVALID_GAME_CODE);
      expect(result.message).toBe('Código de partida debe tener entre 4 y 10 caracteres');
    });

    it('should reject too long game code', () => {
      const result = GameValidationService.validateGameCode('ABCDEFGHIJK');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(GameValidationService.ERROR_CODES.INVALID_GAME_CODE);
      expect(result.message).toBe('Código de partida debe tener entre 4 y 10 caracteres');
    });

    it('should reject invalid characters in game code', () => {
      const result = GameValidationService.validateGameCode('TEST-01');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(GameValidationService.ERROR_CODES.INVALID_GAME_CODE);
      expect(result.message).toBe('Código de partida solo puede contener letras y números');
    });
  });

  describe('validatePlayerId', () => {
    it('should validate correct player ID', () => {
      const result = GameValidationService.validatePlayerId('player123');

      expect(result.isValid).toBe(true);
      expect(result.errorCode).toBeNull();
      expect(result.message).toBeNull();
    });

    it('should reject empty player ID', () => {
      const result = GameValidationService.validatePlayerId('');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(GameValidationService.ERROR_CODES.INVALID_PLAYER_ID);
      expect(result.message).toBe('ID de jugador es requerido');
    });

    it('should reject whitespace-only player ID', () => {
      const result = GameValidationService.validatePlayerId('   ');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(GameValidationService.ERROR_CODES.INVALID_PLAYER_ID);
      expect(result.message).toBe('ID de jugador no puede estar vacío');
    });

    it('should reject too long player ID', () => {
      const longId = 'a'.repeat(51);
      const result = GameValidationService.validatePlayerId(longId);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(GameValidationService.ERROR_CODES.INVALID_PLAYER_ID);
      expect(result.message).toBe('ID de jugador no puede tener más de 50 caracteres');
    });
  });

  describe('validateCard', () => {
    it('should validate correct card', () => {
      const card = { suit: 'hearts', rank: 'A' };
      const result = GameValidationService.validateCard(card);

      expect(result.isValid).toBe(true);
      expect(result.errorCode).toBeNull();
      expect(result.message).toBeNull();
    });

    it('should reject card without suit', () => {
      const card = { rank: 'A' };
      const result = GameValidationService.validateCard(card);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(GameValidationService.ERROR_CODES.INVALID_CARD);
      expect(result.message).toBe('Carta debe tener palo y valor');
    });

    it('should reject card without rank', () => {
      const card = { suit: 'hearts' };
      const result = GameValidationService.validateCard(card);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(GameValidationService.ERROR_CODES.INVALID_CARD);
      expect(result.message).toBe('Carta debe tener palo y valor');
    });

    it('should reject card with invalid suit', () => {
      const card = { suit: 'invalid', rank: 'A' };
      const result = GameValidationService.validateCard(card);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(GameValidationService.ERROR_CODES.INVALID_CARD);
      expect(result.message).toBe('Palo de carta inválido');
    });

    it('should reject card with invalid rank', () => {
      const card = { suit: 'hearts', rank: 'invalid' };
      const result = GameValidationService.validateCard(card);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(GameValidationService.ERROR_CODES.INVALID_CARD);
      expect(result.message).toBe('Valor de carta inválido');
    });
  });

  describe('validatePlayerJoin', () => {
    const mockGame = {
      status: 'waiting',
      players: ['player1', 'player2']
    };

    it('should allow valid player to join', () => {
      const result = GameValidationService.validatePlayerJoin(mockGame, 'player3');

      expect(result.isValid).toBe(true);
      expect(result.errorCode).toBeNull();
      expect(result.message).toBeNull();
    });

    it('should reject player joining started game', () => {
      const startedGame = { ...mockGame, status: 'started' };
      const result = GameValidationService.validatePlayerJoin(startedGame, 'player3');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(GameValidationService.ERROR_CODES.INVALID_GAME_STATE);
      expect(result.message).toBe('La partida ya ha comenzado o terminado');
    });

    it('should reject existing player', () => {
      const result = GameValidationService.validatePlayerJoin(mockGame, 'player1');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(GameValidationService.ERROR_CODES.PLAYER_ALREADY_EXISTS);
      expect(result.message).toBe('El jugador ya está en la partida');
    });

    it('should reject joining full game', () => {
      const fullGame = {
        ...mockGame,
        players: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8']
      };
      const result = GameValidationService.validatePlayerJoin(fullGame, 'player9');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(GameValidationService.ERROR_CODES.GAME_FULL);
      expect(result.message).toBe('La partida está llena');
    });
  });

  describe('validateCardDraw', () => {
    const mockGame = {
      status: 'started',
      players: ['player1', 'player2'],
      currentTurn: 0,
      deck: [{ id: 'AS', suit: 'spades', rank: 'A' }]
    };

    it('should allow valid card draw', () => {
      const result = GameValidationService.validateCardDraw(mockGame, 'player1');

      expect(result.isValid).toBe(true);
      expect(result.errorCode).toBeNull();
      expect(result.message).toBeNull();
    });

    it('should reject draw when not player turn', () => {
      const result = GameValidationService.validateCardDraw(mockGame, 'player2');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(GameValidationService.ERROR_CODES.NOT_PLAYER_TURN);
      expect(result.message).toBe('No es el turno del jugador');
    });

    it('should reject draw when game not started', () => {
      const waitingGame = { ...mockGame, status: 'waiting' };
      const result = GameValidationService.validateCardDraw(waitingGame, 'player1');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(GameValidationService.ERROR_CODES.GAME_NOT_STARTED);
      expect(result.message).toBe('La partida no ha comenzado');
    });

    it('should reject draw when deck is empty', () => {
      const emptyDeckGame = { ...mockGame, deck: [] };
      const result = GameValidationService.validateCardDraw(emptyDeckGame, 'player1');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(GameValidationService.ERROR_CODES.DECK_EMPTY);
      expect(result.message).toBe('No hay cartas en el mazo');
    });

    it('should reject draw when player not in game', () => {
      const result = GameValidationService.validateCardDraw(mockGame, 'player3');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(GameValidationService.ERROR_CODES.PLAYER_NOT_FOUND);
      expect(result.message).toBe('El jugador no está en la partida');
    });
  });

  describe('validateCardActivation', () => {
    const mockGame = {
      status: 'started',
      players: ['player1', 'player2'],
      venganzaCards: [{ playerId: 'player1', card: { id: 'AS' } }]
    };

    it('should allow valid card activation', () => {
      const result = GameValidationService.validateCardActivation(mockGame, 'player1', 'brinco');

      expect(result.isValid).toBe(true);
      expect(result.errorCode).toBeNull();
      expect(result.message).toBeNull();
    });

    it('should reject invalid card type', () => {
      const result = GameValidationService.validateCardActivation(mockGame, 'player1', 'invalid');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(GameValidationService.ERROR_CODES.INVALID_CARD_TYPE);
      expect(result.message).toBe('Tipo de carta inválido');
    });

    it('should reject venganza without target', () => {
      const result = GameValidationService.validateCardActivation(mockGame, 'player1', 'venganza');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(GameValidationService.ERROR_CODES.INVALID_TARGET_PLAYER);
      expect(result.message).toBe('La venganza requiere un jugador objetivo');
    });

    it('should reject venganza with invalid target', () => {
      const result = GameValidationService.validateCardActivation(mockGame, 'player1', 'venganza', 'player3');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(GameValidationService.ERROR_CODES.INVALID_TARGET_PLAYER);
      expect(result.message).toBe('El jugador objetivo no está en la partida');
    });

    it('should reject venganza when no venganzas available', () => {
      const noVenganzaGame = { ...mockGame, venganzaCards: [] };
      const result = GameValidationService.validateCardActivation(noVenganzaGame, 'player1', 'venganza', 'player2');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(GameValidationService.ERROR_CODES.NO_VENGANZA_AVAILABLE);
      expect(result.message).toBe('No tienes venganzas disponibles');
    });
  });

  describe('validateBrincoResult', () => {
    it('should validate success result', () => {
      const result = GameValidationService.validateBrincoResult('success');

      expect(result.isValid).toBe(true);
      expect(result.errorCode).toBeNull();
      expect(result.message).toBeNull();
    });

    it('should validate failure result', () => {
      const result = GameValidationService.validateBrincoResult('failure');

      expect(result.isValid).toBe(true);
      expect(result.errorCode).toBeNull();
      expect(result.message).toBeNull();
    });

    it('should reject invalid result', () => {
      const result = GameValidationService.validateBrincoResult('invalid');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(GameValidationService.ERROR_CODES.INVALID_BRINCO_RESULT);
      expect(result.message).toBe('Resultado de brinco inválido');
    });
  });

  describe('validateMovementDirection', () => {
    it('should validate left direction', () => {
      const result = GameValidationService.validateMovementDirection('left');

      expect(result.isValid).toBe(true);
      expect(result.errorCode).toBeNull();
      expect(result.message).toBeNull();
    });

    it('should validate right direction', () => {
      const result = GameValidationService.validateMovementDirection('right');

      expect(result.isValid).toBe(true);
      expect(result.errorCode).toBeNull();
      expect(result.message).toBeNull();
    });

    it('should reject invalid direction', () => {
      const result = GameValidationService.validateMovementDirection('up');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(GameValidationService.ERROR_CODES.INVALID_MOVEMENT_DIRECTION);
      expect(result.message).toBe('Dirección de movimiento inválida');
    });
  });

  describe('validateGameRules', () => {
    it('should validate correct rules', () => {
      const rules = {
        'A': 'venganza',
        'K': 'copa del rey',
        '2': 'brinco'
      };
      const result = GameValidationService.validateGameRules(rules);

      expect(result.isValid).toBe(true);
      expect(result.errorCode).toBeNull();
      expect(result.message).toBeNull();
    });

    it('should reject invalid rule format', () => {
      const result = GameValidationService.validateGameRules('invalid');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(GameValidationService.ERROR_CODES.INVALID_RULES);
      expect(result.message).toBe('Las reglas deben ser un objeto');
    });

    it('should reject invalid card rank', () => {
      const rules = {
        'X': 'invalid card'
      };
      const result = GameValidationService.validateGameRules(rules);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(GameValidationService.ERROR_CODES.INVALID_RULES);
      expect(result.message).toBe('Carta inválida en las reglas: X');
    });

    it('should reject empty rule', () => {
      const rules = {
        'A': ''
      };
      const result = GameValidationService.validateGameRules(rules);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(GameValidationService.ERROR_CODES.INVALID_RULES);
      expect(result.message).toBe('Regla inválida para la carta A');
    });
  });

  describe('createSuccessResult and createErrorResult', () => {
    it('should create success result', () => {
      const result = GameValidationService.createSuccessResult();

      expect(result.isValid).toBe(true);
      expect(result.errorCode).toBeNull();
      expect(result.message).toBeNull();
    });

    it('should create error result', () => {
      const result = GameValidationService.createErrorResult('TEST_ERROR', 'Test message');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('TEST_ERROR');
      expect(result.message).toBe('Test message');
    });
  });
});
