/**
 * Exporta todos los casos de uso
 */
const ActivateCard = require('./ActivateCard');
const CreateGame = require('./CreateGame');
const DrawCard = require('./DrawCard');
const EndGame = require('./EndGame');
const GetGameState = require('./GetGameState');
const JoinGame = require('./JoinGame');
const StartGame = require('./StartGame');
const UpdateRules = require('./UpdateRules');

module.exports = {
  ActivateCard,
  CreateGame,
  DrawCard,
  EndGame,
  GetGameState,
  JoinGame,
  StartGame,
  UpdateRules
};
