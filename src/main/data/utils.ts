import fs from 'fs';
import type { Database } from 'sqlite';

export function ensureDirExists(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

export async function setDbPragmas(db: Database) {
  await db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA temp_store = MEMORY;
      PRAGMA foreign_keys = ON;
    `);
}
