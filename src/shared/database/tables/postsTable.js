import { SYNC_COLUMNS } from './syncColumns';

// Registros de pets. O fuso (occurred_zone) e os dados do reencontro
// (found_info) são objetos, gravados como texto JSON.
export const POSTS_TABLE = `
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY NOT NULL,
  author_id TEXT,
  pet_name TEXT,
  species TEXT,
  size TEXT,
  sex TEXT,
  color TEXT,
  breed TEXT,
  description TEXT,
  latitude REAL,
  longitude REAL,
  location TEXT,
  occurred_at TEXT,
  occurred_zone TEXT,
  status TEXT NOT NULL,
  contact_phone TEXT,
  found_info TEXT,${SYNC_COLUMNS}
);`;
