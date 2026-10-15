import { SYNC_COLUMNS } from './syncColumns';

// Perfil de cada conta (uma linha por conta)
export const PROFILES_TABLE = `
CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  photo_uri TEXT,${SYNC_COLUMNS}
);`;
