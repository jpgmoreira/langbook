import type { Database } from 'sqlite';

export async function setDbPragmas(db: Database) {
  await db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA temp_store = MEMORY;
      PRAGMA foreign_keys = ON;
    `);
}

export async function createTables(db: Database) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      front TEXT NOT NULL,
      back TEXT NOT NULL DEFAULT '',
      extra TEXT NOT NULL DEFAULT '',
      allowReversed BOOLEAN NOT NULL DEFAULT FALSE,
      createdAt INTEGER NOT NULL,
      frequency INTEGER NOT NULL,
      tags TEXT NOT NULL,
      sessions TEXT NOT NULL,
      media TEXT NOT NULL,
      height INTEGER NOT NULL
    );
  `);
}
