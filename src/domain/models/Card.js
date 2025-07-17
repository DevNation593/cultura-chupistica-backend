/**
 * Modelo de dominio para una carta de la baraja inglesa
 */
class Card {
  constructor(suit, rank) {
    this.suit = suit;   // 'hearts', 'diamonds', 'clubs', 'spades'
    this.rank = rank;   // 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'
    this.id = `${rank}_${suit}`;
  }

  /**
   * Obtiene el valor numérico de la carta para comparaciones
   * @returns {number}
   */
  getValue() {
    switch (this.rank) {
      case 'A': return 1;
      case 'J': return 11;
      case 'Q': return 12;
      case 'K': return 13;
      default: return parseInt(this.rank);
    }
  }

  /**
   * Obtiene el nombre completo de la carta
   * @returns {string}
   */
  getFullName() {
    const suitNames = {
      'hearts': 'Corazones',
      'diamonds': 'Diamantes',
      'clubs': 'Tréboles',
      'spades': 'Picas'
    };

    const rankNames = {
      'A': 'As',
      'J': 'Jota',
      'Q': 'Reina',
      'K': 'Rey'
    };

    const rankName = rankNames[this.rank] || this.rank;
    const suitName = suitNames[this.suit];

    return `${rankName} de ${suitName}`;
  }

  /**
   * Verifica si la carta es una figura (J, Q, K)
   * @returns {boolean}
   */
  isFaceCard() {
    return ['J', 'Q', 'K'].includes(this.rank);
  }

  /**
   * Verifica si la carta es un As
   * @returns {boolean}
   */
  isAce() {
    return this.rank === 'A';
  }

  /**
   * Verifica si la carta es roja (corazones o diamantes)
   * @returns {boolean}
   */
  isRed() {
    return ['hearts', 'diamonds'].includes(this.suit);
  }

  /**
   * Verifica si la carta es negra (tréboles o picas)
   * @returns {boolean}
   */
  isBlack() {
    return ['clubs', 'spades'].includes(this.suit);
  }

  /**
   * Convierte la carta a objeto para serialización
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      suit: this.suit,
      rank: this.rank,
      value: this.getValue(),
      fullName: this.getFullName(),
      isFaceCard: this.isFaceCard(),
      isAce: this.isAce(),
      isRed: this.isRed(),
      isBlack: this.isBlack()
    };
  }

  /**
   * Crea una carta desde un objeto
   * @param {Object} cardData 
   * @returns {Card}
   */
  static fromJSON(cardData) {
    return new Card(cardData.suit, cardData.rank);
  }
}

module.exports = Card;
