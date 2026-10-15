import { PROFILES_TABLE } from './tables/profilesTable';
import { POSTS_TABLE } from './tables/postsTable';
import { POST_IMAGES_TABLE } from './tables/postImagesTable';

// Comandos executados ao abrir o banco. "IF NOT EXISTS" faz com que só criem
// as tabelas na primeira vez.
const SETTINGS = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;`;

export const SCHEMA = [
  SETTINGS,
  PROFILES_TABLE,
  POSTS_TABLE,
  POST_IMAGES_TABLE,
].join('\n');
