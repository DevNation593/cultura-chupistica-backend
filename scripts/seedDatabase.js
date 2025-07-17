#!/usr/bin/env node

/**
 * Script para poblar la base de datos con datos de prueba
 */

require('dotenv').config();
const DatabaseConfig = require('../src/infrastructure/db/DatabaseConfig');
const GameRepository = require('../src/infrastructure/db/GameRepository');
const { GameService, CardService } = require('../src/domain/services');

/**
 * Crear juegos de prueba
 */
async function createTestGames() {
  console.log('🎮 Creando juegos de prueba...');
  
  const gameRepository = new GameRepository();
  const games = [];
  
  try {
    // Juego 1: Nuevo juego
    const game1 = GameService.createGame('player1');
    game1.code = 'TEST01';
    game1.name = 'Juego de Prueba 1';
    await gameRepository.create(game1);
    games.push(game1);
    console.log('✅ Creado juego TEST01');
    
    // Juego 2: Juego con jugadores
    const game2 = GameService.createGame('player2');
    game2.code = 'TEST02';
    game2.name = 'Juego de Prueba 2';
    GameService.addPlayer(game2, 'player3');
    GameService.addPlayer(game2, 'player4');
    await gameRepository.create(game2);
    games.push(game2);
    console.log('✅ Creado juego TEST02 con jugadores');
    
    // Juego 3: Juego en progreso
    const game3 = GameService.createGame('host123');
    game3.code = 'PROG01';
    game3.name = 'Juego en Progreso';
    GameService.addPlayer(game3, 'player5');
    GameService.addPlayer(game3, 'player6');
    GameService.startGame(game3);
    
    // Simular algunas cartas dibujadas
    const card1 = CardService.drawCard(game3);
    CardService.activateCard(game3, card1, 'host123');
    const card2 = CardService.drawCard(game3);
    CardService.activateCard(game3, card2, 'player5');
    
    await gameRepository.create(game3);
    games.push(game3);
    console.log('✅ Creado juego PROG01 en progreso');
    
    // Juego 4: Juego terminado
    const game4 = GameService.createGame('oldhost');
    game4.code = 'ENDED1';
    game4.name = 'Juego Terminado';
    GameService.addPlayer(game4, 'oldplayer1');
    GameService.startGame(game4);
    GameService.endGame(game4, 'Game completed');
    await gameRepository.create(game4);
    games.push(game4);
    console.log('✅ Creado juego ENDED1 terminado');
    
    return games;
    
  } catch (error) {
    console.error('❌ Error creando juegos de prueba:', error);
    throw error;
  }
}

/**
 * Poblar base de datos con datos de prueba
 */
async function seedDatabase() {
  console.log('🌱 Poblando base de datos con datos de prueba...');
  
  try {
    // Conectar a la base de datos
    await DatabaseConfig.connect();
    
    // Verificar que la base de datos esté vacía (opcional)
    const gameRepository = new GameRepository();
    const existingGames = await gameRepository.getActiveGames();
    
    if (existingGames.length > 0) {
      console.log(`⚠️  Se encontraron ${existingGames.length} juegos existentes`);
      console.log('💡 Ejecuta npm run db:reset para limpiar la base de datos primero');
    }
    
    // Crear juegos de prueba
    const testGames = await createTestGames();
    
    // Mostrar resumen
    console.log('\n📊 Resumen de datos creados:');
    console.log(`  📂 Juegos creados: ${testGames.length}`);
    console.log(`  🎮 Juegos activos: ${testGames.filter(g => g.status === 'waiting' || g.status === 'playing').length}`);
    console.log(`  ✅ Juegos terminados: ${testGames.filter(g => g.status === 'finished').length}`);
    
    console.log('\n🔗 Códigos de juego disponibles:');
    testGames.forEach(game => {
      console.log(`  - ${game.code}: ${game.name} (${game.status})`);
    });
    
    console.log('\n✅ Base de datos poblada correctamente');
    
  } catch (error) {
    console.error('❌ Error poblando base de datos:', error);
    process.exit(1);
  } finally {
    await DatabaseConfig.disconnect();
    console.log('🔌 Desconectado de la base de datos');
  }
}

/**
 * Verificar entorno
 */
function verifyEnvironment() {
  const environment = process.env.NODE_ENV || 'development';
  
  if (environment === 'production') {
    console.error('❌ No se puede poblar base de datos en producción');
    process.exit(1);
  }
  
  console.log(`✅ Entorno verificado: ${environment}`);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  verifyEnvironment();
  seedDatabase();
}

module.exports = { seedDatabase };
