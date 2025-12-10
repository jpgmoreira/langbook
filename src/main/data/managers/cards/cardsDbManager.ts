import path from 'path';
import { DATA_DIR } from '../../constants';
import { open, type Database } from 'sqlite';
import { Card, DBCard } from '@common/schemas/card';
import sqlite3 from 'sqlite3';
import { setDbPragmas } from '../../sql/common';

/**
 * Singleton for managing the db.
 * Access via CardsDbManager.instance
 */
export class CardsDbManager {
  static #instance: CardsDbManager;

  private db: Database | null = null;
  private constructor() {}

  public static get instance(): CardsDbManager {
    if (!this.#instance) {
      this.#instance = new CardsDbManager();
    }
    return this.#instance;
  }

  public async loadProfile(profileId: string) {
    const filename = path.join(DATA_DIR, 'profileData', profileId, 'cards.sqlite');
    this.db = await open({
      filename,
      driver: sqlite3.Database,
    });
    await setDbPragmas(this.db);
    await this.createTables(this.db);
  }

  private async createTables(db: Database) {
    await db.exec(`
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      front TEXT NOT NULL,
      back TEXT NOT NULL DEFAULT '',
      extra TEXT NOT NULL DEFAULT '',
      allowReversed BOOLEAN NOT NULL DEFAULT FALSE,
      createdAt INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'normal',
      tier INTEGER NOT NULL DEFAULT 0,
      core BOOLEAN NOT NULL DEFAULT FALSE,
      tags TEXT NOT NULL,
      sessions TEXT NOT NULL,
      media TEXT NOT NULL,
      height INTEGER NOT NULL
    );
  `);
  }

  public async loadAllCards(): Promise<Card[]> {
    if (!this.db) throw new Error('Db not initialized');
    const result = (await this.db.all('SELECT * FROM cards')) as DBCard[];
    return result.map(this.deserializeCard);
  }

  public async deleteCard(cardId: string) {
    if (!this.db) throw new Error('Db not initialized');
    await this.db.run('DELETE FROM cards WHERE id = ?', cardId);
  }

  public async insertCard(card: Card) {
    if (!this.db) throw new Error('Db not initialized');
    const serialized = this.serializeCard(card);
    await this.db.run(
      `
      INSERT INTO cards (
        id, front, back, extra, media, allowReversed,
        createdAt, sessions, tags, status, tier, core, height
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        serialized.status,
        serialized.tier,
        serialized.core,
        serialized.height,
      ]
    );
  }

  public async updateCard(card: Card) {
    if (!this.db) throw new Error('Db not initialized');
    const serialized = this.serializeCard(card);
    await this.db.run(
      `
      UPDATE cards SET
        front = ?,
        back = ?,
        extra = ?,
        media = ?,
        allowReversed = ?,
        createdAt = ?,
        sessions = ?,
        tags = ?,
        status = ?,
        tier = ?,
        core = ?,
        height = ?
      WHERE id = ?
    `,
      [
        serialized.front,
        serialized.back,
        serialized.extra,
        serialized.media,
        serialized.allowReversed,
        serialized.createdAt,
        serialized.sessions,
        serialized.tags,
        serialized.status,
        serialized.tier,
        serialized.core,
        serialized.height,
        serialized.id,
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

  private deserializeCard(card: DBCard): Card {
    const result = {
      ...card,
      tags: JSON.parse(card.tags),
      sessions: JSON.parse(card.sessions),
      media: JSON.parse(card.media),
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
