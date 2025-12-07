/**
 * Constants used just by the main process.
 */
import { is } from '@electron-toolkit/utils';
import { app } from 'electron';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const DATA_DIR = is.dev
  ? resolve(__dirname, '../..', 'langbook-data')
  : resolve(app.getPath('userData'), 'langbook-data');

export const TREE_PAGE_SIZE = 100;
