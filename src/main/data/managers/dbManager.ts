import path from 'path';
import { DATA_DIR } from '../constants';
import { EventEmitter } from '@common/events/eventEmitter';
import { Events } from '@main/events/events';
import { open, type Database } from 'sqlite';
import { Card, DBCard } from '@common/schemas/card';
import sqlite3 from 'sqlite3';
import { setDbPragmas, createTables } from '../sql/db';

EventEmitter.instance.on(Events.clearProfileData, () => {
  DbManager.instance.clear();
});

/**
 * Singleton for managing the db.
 * Access via DbManager.instance
 */
export class DbManager {
  static #instance: DbManager;

  private db: Database | null = null;
  private constructor() {}

  public static get instance(): DbManager {
    if (!this.#instance) {
      this.#instance = new DbManager();
    }
    return this.#instance;
  }

  public async loadProfile(profileId: string) {
    const filename = path.join(DATA_DIR, 'profileData', profileId, 'db.sqlite');
    this.db = await open({
      filename,
      driver: sqlite3.Database,
    });
    await setDbPragmas(this.db);
    await createTables(this.db);
  }

  public async loadAllCards(): Promise<Card[]> {
    if (!this.db) return [];
    const result = (await this.db.all('SELECT * FROM cards')) as Card[];
    return result;
  }

  public async deleteCard(cardId: string) {
    if (!this.db) return;
    await this.db.run('DELETE FROM cards WHERE id = ?', cardId);
  }

  public async insertCard(card: Card) {
    if (!this.db) return;
    const serialized = this.serializeCard(card);
    await this.db.run(
      `
      INSERT INTO cards (
        id, front, back, extra, media, allowReversed,
        createdAt, sessions, tags, frequency, height
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        serialized.id,
        serialized.front,
        serialized.back,
        serialized.extra,
        serialized.media,
        serialized.allowReversed,
        serialized.createdAt,
        serialized.sessions,
        serialized.tags,
        serialized.frequency,
        serialized.height,
      ]
    );
  }

  private serializeCard(card: Card): DBCard {
    const result = {
      ...card,
      tags: JSON.stringify(card.tags),
      sessions: JSON.stringify(card.sessions),
      media: JSON.stringify(card.media),
    };
    return result;
  }

  public async clear() {
    if (this.db) {
      await this.db.close();
    }
    this.db = null;
  }
}
