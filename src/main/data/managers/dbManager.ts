import path from 'path';
import { DATA_DIR } from '../constants';
import { EventEmitter } from '@common/events/eventEmitter';
import { Events } from '@main/events/events';
import { open, type Database } from 'sqlite';
import { Card } from '@common/schemas/card';
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

  public async clear() {
    if (this.db) {
      await this.db.close();
    }
    this.db = null;
  }
}
