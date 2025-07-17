const Card = require('../models/Card');

/**
 * Servicio de dominio para operaciones relacionadas con cartas
 */
class CardService {
  /**
   * Crea una baraja completa de 52 cartas
   * @returns {Array<Card>} baraja completa
   */
  static createFullDeck() {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];

    suits.forEach(suit => {
      ranks.forEach(rank => {
        deck.push(new Card(suit, rank));
      });
    });

    return deck;
  }

  /**
   * Mezcla una baraja usando el algoritmo Fisher-Yates
   * @param {Array<Card>} deck baraja a mezclar
   * @returns {Array<Card>} baraja mezclada
   */
  static shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Crea una baraja completa y la mezcla
   * @returns {Array<Card>} baraja mezclada
   */
  static createShuffledDeck() {
    const deck = this.createFullDeck();
    return this.shuffleDeck(deck);
  }

  /**
   * Busca una carta específica en una baraja
   * @param {Array<Card>} deck baraja donde buscar
   * @param {string} suit palo de la carta
   * @param {string} rank valor de la carta
   * @returns {Card|null} carta encontrada o null
   */
  static findCard(deck, suit, rank) {
    return deck.find(card => card.suit === suit && card.rank === rank) || null;
  }

  /**
   * Busca una carta por ID
   * @param {Array<Card>} deck baraja donde buscar
   * @param {string} cardId ID de la carta
   * @returns {Card|null} carta encontrada o null
   */
  static findCardById(deck, cardId) {
    return deck.find(card => card.id === cardId) || null;
  }

  /**
   * Filtra cartas por palo
   * @param {Array<Card>} deck baraja a filtrar
   * @param {string} suit palo a filtrar
   * @returns {Array<Card>} cartas del palo especificado
   */
  static filterBySuit(deck, suit) {
    return deck.filter(card => card.suit === suit);
  }

  /**
   * Filtra cartas por valor
   * @param {Array<Card>} deck baraja a filtrar
   * @param {string} rank valor a filtrar
   * @returns {Array<Card>} cartas del valor especificado
   */
  static filterByRank(deck, rank) {
    return deck.filter(card => card.rank === rank);
  }

  /**
   * Filtra cartas rojas (corazones y diamantes)
   * @param {Array<Card>} deck baraja a filtrar
   * @returns {Array<Card>} cartas rojas
   */
  static filterRedCards(deck) {
    return deck.filter(card => card.isRed());
  }

  /**
   * Filtra cartas negras (tréboles y picas)
   * @param {Array<Card>} deck baraja a filtrar
   * @returns {Array<Card>} cartas negras
   */
  static filterBlackCards(deck) {
    return deck.filter(card => card.isBlack());
  }

  /**
   * Filtra cartas de figura (J, Q, K)
   * @param {Array<Card>} deck baraja a filtrar
   * @returns {Array<Card>} cartas de figura
   */
  static filterFaceCards(deck) {
    return deck.filter(card => card.isFaceCard());
  }

  /**
   * Filtra cartas que se pueden guardar (A, 5, 9)
   * @param {Array<Card>} deck baraja a filtrar
   * @returns {Array<Card>} cartas que se pueden guardar
   */
  static filterSaveableCards(deck) {
    return deck.filter(card => ['A', '5', '9'].includes(card.rank));
  }

  /**
   * Ordena las cartas por valor
   * @param {Array<Card>} deck baraja a ordenar
   * @param {boolean} ascending orden ascendente (true) o descendente (false)
   * @returns {Array<Card>} cartas ordenadas
   */
  static sortByValue(deck, ascending = true) {
    return deck.sort((a, b) => {
      const comparison = a.getValue() - b.getValue();
      return ascending ? comparison : -comparison;
    });
  }

  /**
   * Ordena las cartas por palo
   * @param {Array<Card>} deck baraja a ordenar
   * @returns {Array<Card>} cartas ordenadas por palo
   */
  static sortBySuit(deck) {
    const suitOrder = ['hearts', 'diamonds', 'clubs', 'spades'];
    return deck.sort((a, b) => {
      return suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
    });
  }

  /**
   * Valida que una carta sea válida
   * @param {Card} card carta a validar
   * @returns {boolean} true si es válida
   */
  static isValidCard(card) {
    if (!card || !card.suit || !card.rank) {
      return false;
    }

    const validSuits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const validRanks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    return validSuits.includes(card.suit) && validRanks.includes(card.rank);
  }

  /**
   * Valida que una baraja esté completa (52 cartas únicas)
   * @param {Array<Card>} deck baraja a validar
   * @returns {boolean} true si está completa
   */
  static isCompleteDeck(deck) {
    if (deck.length !== 52) {
      return false;
    }

    const cardIds = new Set();
    for (const card of deck) {
      if (!this.isValidCard(card)) {
        return false;
      }
      
      if (cardIds.has(card.id)) {
        return false; // Carta duplicada
      }
      
      cardIds.add(card.id);
    }

    return true;
  }

  /**
   * Obtiene estadísticas de una baraja
   * @param {Array<Card>} deck baraja a analizar
   * @returns {Object} estadísticas
   */
  static getDeckStats(deck) {
    const stats = {
      totalCards: deck.length,
      redCards: this.filterRedCards(deck).length,
      blackCards: this.filterBlackCards(deck).length,
      faceCards: this.filterFaceCards(deck).length,
      aces: this.filterByRank(deck, 'A').length,
      saveableCards: this.filterSaveableCards(deck).length,
      suitCounts: {
        hearts: this.filterBySuit(deck, 'hearts').length,
        diamonds: this.filterBySuit(deck, 'diamonds').length,
        clubs: this.filterBySuit(deck, 'clubs').length,
        spades: this.filterBySuit(deck, 'spades').length
      },
      averageValue: deck.reduce((sum, card) => sum + card.getValue(), 0) / deck.length
    };

    return stats;
  }

  /**
   * Convierte una baraja a formato JSON
   * @param {Array<Card>} deck baraja a convertir
   * @returns {Array<Object>} baraja en formato JSON
   */
  static deckToJSON(deck) {
    return deck.map(card => card.toJSON());
  }

  /**
   * Convierte un array JSON a baraja de cartas
   * @param {Array<Object>} deckData datos de la baraja
   * @returns {Array<Card>} baraja de cartas
   */
  static deckFromJSON(deckData) {
    return deckData.map(cardData => Card.fromJSON(cardData));
  }
}

module.exports = CardService;
