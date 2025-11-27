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
      front TEXT NOT NULL
      back TEXT,
      extra TEXT,
      allowReversed BOOLEAN NOT NULL DEFAULT FALSE,
      createdAt INTEGER NOT NULL,
      

      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date INTEGER UNIQUE NOT NULL,
      cf INTEGER NOT NULL,
      neps INTEGER NOT NULL,
      leetcode INTEGER NOT NULL,
      timus INTEGER NOT NULL,
      uva INTEGER NOT NULL,
      kattis INTEGER NOT NULL,
      contests INTEGER NOT NULL
    );
  `);
  await db.exec('CREATE INDEX IF NOT EXISTS idx_graph_date ON graph (date);');
}
