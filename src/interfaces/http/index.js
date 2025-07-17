/**
 * Exporta las interfaces HTTP
 */
const GameController = require('./controllers/GameController');
const createGameRoutes = require('./routes/GameRoutes');
const validations = require('./middlewares/validations');

module.exports = {
  GameController,
  createGameRoutes,
  validations
};
