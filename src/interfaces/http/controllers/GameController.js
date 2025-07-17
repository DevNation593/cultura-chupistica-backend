/**
 * Controlador HTTP para operaciones de partidas
 * Recibe los casos de uso como dependencias
 */
class GameController {
  constructor(useCases, domainServices) {
    this.useCases = useCases || {};
    this.domainServices = domainServices || {};
    
    // Binding de métodos para mantener contexto
    if (typeof this.create === 'function') this.create = this.create.bind(this);
    if (typeof this.join === 'function') this.join = this.join.bind(this);
    if (typeof this.start === 'function') this.start = this.start.bind(this);
    if (typeof this.draw === 'function') this.draw = this.draw.bind(this);
    if (typeof this.activate === 'function') this.activate = this.activate.bind(this);
    if (typeof this.end === 'function') this.end = this.end.bind(this);
    if (typeof this.getById === 'function') this.getById = this.getById.bind(this);
    if (typeof this.getAll === 'function') this.getAll = this.getAll.bind(this);
    if (typeof this.getState === 'function') this.getState = this.getState.bind(this);
    if (typeof this.getActivableCards === 'function') this.getActivableCards = this.getActivableCards.bind(this);
    if (typeof this.getHistory === 'function') this.getHistory = this.getHistory.bind(this);
    if (typeof this.getStats === 'function') this.getStats = this.getStats.bind(this);
    if (typeof this.updateRules === 'function') this.updateRules = this.updateRules.bind(this);
    if (typeof this.getRules === 'function') this.getRules = this.getRules.bind(this);
    if (typeof this.resetRules === 'function') this.resetRules = this.resetRules.bind(this);
    if (typeof this.getFinalSummary === 'function') this.getFinalSummary = this.getFinalSummary.bind(this);
  }

  /**
   * Crear una nueva partida
   * POST /api/games
   */
  async create(req, res) {
    try {
      const { hostId, customCode } = req.body;

      const result = await this.useCases.createGame.execute({
        hostId,
        customCode
      });

      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.data,
          message: 'Partida creada exitosamente'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Error interno del servidor',
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Unirse a una partida
   * POST /api/games/:code/join
   */
  async join(req, res) {
    try {
      const { code } = req.params;
      const { playerId } = req.body;

      const result = await this.useCases.joinGame.execute({
        gameCode: code,
        playerId
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: 'Te has unido a la partida exitosamente'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Error interno del servidor',
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Obtener estado de una partida
   * GET /api/games/:code
   */
  async getState(req, res) {
    try {
      const { code } = req.params;
      const { playerId } = req.query;

      // Verificar si existe caso de uso
      if (!this.useCases.getGameState) {
        // Usar repositorio y servicios de dominio directamente si no hay caso de uso
        try {
          const game = await this.useCases.gameRepository.findByCode(code);
          
          if (!game) {
            return res.status(404).json({
              success: false,
              error: {
                message: 'Partida no encontrada',
                code: 'GAME_NOT_FOUND'
              }
            });
          }
          
          // Usar servicios de dominio para crear contextos
          const gameContext = this.domainServices.DomainUtils.createGameContext(game);
          
          if (playerId) {
            const playerContext = this.domainServices.DomainUtils.createPlayerContext(game, playerId);
            gameContext.player = playerContext;
          }
          
          return res.status(200).json({
            success: true,
            data: gameContext
          });
        } catch (repoError) {
          throw repoError;
        }
      }

      const result = await this.useCases.getGameState.execute({
        gameCode: code,
        playerId
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: 'Estado obtenido exitosamente'
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Error interno del servidor',
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Iniciar una partida
   * POST /api/games/:code/start
   */
  async start(req, res) {
    try {
      const { code } = req.params;
      const { playerId } = req.body;

      // Verificar si existe caso de uso
      if (!this.useCases.startGame) {
        return res.status(501).json({
          success: false,
          error: {
            message: 'Funcionalidad no implementada',
            code: 'NOT_IMPLEMENTED'
          }
        });
      }

      const result = await this.useCases.startGame.execute({
        gameCode: code,
        playerId
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: 'Partida iniciada exitosamente'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Error interno del servidor',
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Robar una carta
   * POST /api/games/:code/draw
   */
  async draw(req, res) {
    try {
      const { code } = req.params;
      const { playerId } = req.body;

      const result = await this.useCases.drawCard.execute({
        gameCode: code,
        playerId
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: 'Carta robada exitosamente'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Error interno del servidor',
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Activar una carta guardada
   * POST /api/games/:code/activate
   */
  async activate(req, res) {
    try {
      const { code } = req.params;
      const { playerId, cardId, cardType, targetPlayerId } = req.body;

      const result = await this.useCases.activateCard.execute({
        gameCode: code,
        playerId,
        cardId,
        cardType,
        targetPlayerId
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: 'Carta activada exitosamente'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Error interno del servidor',
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Obtener cartas activables de un jugador
   * GET /api/games/:code/activable/:playerId
   */
  async getActivableCards(req, res) {
    try {
      const { code, playerId } = req.params;

      // Verificar si existe método en el caso de uso
      if (!this.useCases.activateCard || !this.useCases.activateCard.getActivableCards) {
        return res.status(501).json({
          success: false,
          error: {
            message: 'Funcionalidad no implementada',
            code: 'NOT_IMPLEMENTED'
          }
        });
      }

      const result = await this.useCases.activateCard.getActivableCards({
        gameCode: code,
        playerId
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: 'Cartas activables obtenidas exitosamente'
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Error interno del servidor',
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Terminar una partida
   * POST /api/games/:code/end
   */
  async end(req, res) {
    try {
      const { code } = req.params;
      const { playerId, reason } = req.body;

      const result = await this.useCases.endGame.execute({
        gameCode: code,
        playerId,
        reason
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: 'Partida terminada exitosamente'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Error interno del servidor',
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Obtener historial de una partida
   * GET /api/games/:code/history
   */
  async getHistory(req, res) {
    try {
      const { code } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      // Verificar si existe caso de uso
      if (!this.useCases.getGameState || !this.useCases.getGameState.getHistory) {
        return res.status(501).json({
          success: false,
          error: {
            message: 'Funcionalidad no implementada',
            code: 'NOT_IMPLEMENTED'
          }
        });
      }

      const result = await this.useCases.getGameState.getHistory({
        gameCode: code,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: 'Historial obtenido exitosamente'
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Error interno del servidor',
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Obtener estadísticas de una partida
   * GET /api/games/:code/stats
   */
  async getStats(req, res) {
    try {
      const { code } = req.params;

      // Verificar si existe caso de uso
      if (!this.useCases.getGameState || !this.useCases.getGameState.getStats) {
        // Usar servicios de dominio directamente si no hay caso de uso
        try {
          const game = await this.useCases.gameRepository.findByCode(code);
          
          if (!game) {
            return res.status(404).json({
              success: false,
              error: {
                message: 'Partida no encontrada',
                code: 'GAME_NOT_FOUND'
              }
            });
          }
          
          // Usar servicios de dominio para calcular estadísticas
          const basicStats = this.domainServices.statsService.calculateBasicStats(game);
          const detailedStats = this.domainServices.statsService.calculateDetailedStats(game);
          
          return res.status(200).json({
            success: true,
            data: {
              basic: basicStats,
              detailed: detailedStats
            }
          });
        } catch (repoError) {
          throw repoError;
        }
      }

      const result = await this.useCases.getGameState.getStats({
        gameCode: code
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: 'Estadísticas obtenidas exitosamente'
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Error interno del servidor',
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Actualizar reglas de una partida
   * PATCH /api/games/:code/rules
   */
  async updateRules(req, res) {
    try {
      const { code } = req.params;
      const { playerId, rules } = req.body;

      // Verificar si existe caso de uso
      if (!this.useCases.updateRules) {
        return res.status(501).json({
          success: false,
          error: {
            message: 'Funcionalidad no implementada',
            code: 'NOT_IMPLEMENTED'
          }
        });
      }

      const result = await this.useCases.updateRules.execute({
        gameCode: code,
        playerId,
        newRules: rules
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: 'Reglas actualizadas exitosamente'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Error interno del servidor',
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Obtener reglas de una partida
   * GET /api/games/:code/rules
   */
  async getRules(req, res) {
    try {
      const { code } = req.params;

      // Verificar si existe caso de uso
      if (!this.useCases.updateRules || !this.useCases.updateRules.getRules) {
        return res.status(501).json({
          success: false,
          error: {
            message: 'Funcionalidad no implementada',
            code: 'NOT_IMPLEMENTED'
          }
        });
      }

      const result = await this.useCases.updateRules.getRules({
        gameCode: code
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: 'Reglas obtenidas exitosamente'
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Error interno del servidor',
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Restablecer reglas a las por defecto
   * POST /api/games/:code/rules/reset
   */
  async resetRules(req, res) {
    try {
      const { code } = req.params;
      const { playerId } = req.body;

      // Verificar si existe caso de uso
      if (!this.useCases.updateRules || !this.useCases.updateRules.resetRules) {
        return res.status(501).json({
          success: false,
          error: {
            message: 'Funcionalidad no implementada',
            code: 'NOT_IMPLEMENTED'
          }
        });
      }

      const result = await this.useCases.updateRules.resetRules({
        gameCode: code,
        playerId
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: 'Reglas restablecidas exitosamente'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Error interno del servidor',
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }

  /**
   * Obtener resumen final de una partida terminada
   * GET /api/games/:code/final-summary
   */
  async getFinalSummary(req, res) {
    try {
      const { code } = req.params;

      // Verificar si existe caso de uso
      if (!this.useCases.endGame || !this.useCases.endGame.getFinalSummary) {
        // Usar servicios de dominio directamente si no hay caso de uso
        try {
          const game = await this.useCases.gameRepository.findByCode(code);
          
          if (!game) {
            return res.status(404).json({
              success: false,
              error: {
                message: 'Partida no encontrada',
                code: 'GAME_NOT_FOUND'
              }
            });
          }
          
          if (game.status !== 'finished') {
            return res.status(400).json({
              success: false,
              error: {
                message: 'La partida aún no ha terminado',
                code: 'GAME_NOT_FINISHED'
              }
            });
          }
          
          // Usar servicios de dominio para crear resumen
          const summary = this.domainServices.DomainUtils.createExecutiveSummary(game);
          
          return res.status(200).json({
            success: true,
            data: summary
          });
        } catch (repoError) {
          throw repoError;
        }
      }

      const result = await this.useCases.endGame.getFinalSummary({
        gameCode: code
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: 'Resumen final obtenido exitosamente'
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Error interno del servidor',
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  }
}

module.exports = GameController;
