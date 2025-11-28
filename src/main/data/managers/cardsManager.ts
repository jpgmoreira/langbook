import { EventEmitter } from '@common/events/eventEmitter';
import { Card } from '@common/schemas/card';
import { Events } from '@main/events/events';
import { DbManager } from './dbManager';
import { FiltersManager } from './filtersManager';
import { shuffleArray } from '@common/utils/utils';

EventEmitter.instance.on(Events.clearProfileData, () => {
  CardsManager.instance.clear();
});

/**
 * Singleton for managing cards.
 * Access via CardsManager.instance
 */
export class CardsManager {
  static #instance: CardsManager;

  private cardsMap: Record<string, Card> = {};
  private filtered: Card[] = [];
  private frequency: Record<number, Card[]> = {};
  private frequencyIndex: Record<number, number> = {};

  private constructor() {}

  public static get instance(): CardsManager {
    if (!this.#instance) {
      this.#instance = new CardsManager();
    }
    return this.#instance;
  }

  public async loadFromDb() {
    // DbManager must have already been initialized.
    const allCards = await DbManager.instance.loadAllCards();
    for (const card of allCards) {
      this.cardsMap[card.id] = card;
    }
    this.refresh();
  }

  private refresh() {
    this.filtered = [];
    for (let i = 0; i <= 10; i++) {
      this.frequency[i] = [];
      this.frequencyIndex[i] = 0;
    }
    Object.values(this.cardsMap).forEach((card: Card) => {
      if (FiltersManager.instance.satisfyCurrentFilters(card)) {
        this.filtered.push(card);
        this.frequency[card.frequency].push(card);
      }
    });
    this.filtered.sort((a, b) => a.createdAt - b.createdAt);
    for (let i = 0; i <= 10; i++) {
      shuffleArray(this.frequency[i]);
    }
  }

  public clear() {}
}
