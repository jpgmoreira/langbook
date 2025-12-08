import path from 'path';
import { DATA_DIR } from '../../constants';
import { open, type Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { setDbPragmas } from '../../sql/common';
import { GraphRecord } from '@common/schemas/graph';
import { getTodayDate } from '@common/utils/dateUtils';

/**
 * Singleton for managing the db.
 * Access via GraphDbManager.instance
 */
export class GraphDbManager {
  static #instance: GraphDbManager;

  private db: Database | null = null;
  private constructor() {}

  public static get instance(): GraphDbManager {
    if (!this.#instance) {
      this.#instance = new GraphDbManager();
    }
    return this.#instance;
  }

  public async loadProfile(profileId: string): Promise<GraphRecord[]> {
    const filename = path.join(DATA_DIR, 'profileData', profileId, 'graph.sqlite');
    this.db = await open({
      filename,
      driver: sqlite3.Database,
    });
    await setDbPragmas(this.db);
    await this.createTables(this.db);
    await this.ensureTodayRecord();
    const result = await this.db.all('SELECT * FROM graph ORDER BY date');
    return result as GraphRecord[];
  }

  private async createTables(db: Database) {
    await db.exec(`
    CREATE TABLE IF NOT EXISTS graph (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date INTEGER UNIQUE NOT NULL,
      minutesStudied INTEGER NOT NULL DEFAULT 0
    );
  `);
  }

  private async ensureTodayRecord() {
    if (!this.db) throw new Error('Database not initialized');
    const todayDate = getTodayDate();
    const existing = await this.db.get('SELECT * FROM graph WHERE date = ?', todayDate);
    if (!existing) {
      await this.db.run('INSERT INTO graph (date, minutesStudied) VALUES (?, ?)', todayDate, 0);
    }
  }

  public async incrementTodayRecord(): Promise<GraphRecord> {
    if (!this.db) throw new Error('Database not initialized');
    const todayDate = getTodayDate();
    const record = (await this.db.get(
      `INSERT INTO graph (date, minutesStudied) VALUES (?, 0)
       ON CONFLICT(date) DO UPDATE SET minutesStudied = minutesStudied + 1
       RETURNING *`,
      todayDate
    )) as GraphRecord;
    return record;
  }

  public async clear() {
    if (this.db) {
      await this.db.close();
    }
    this.db = null;
  }
}
