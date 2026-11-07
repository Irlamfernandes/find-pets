import { SYNC_COLUMNS } from './syncColumns';

export const POST_IMAGES_TABLE = `
CREATE TABLE IF NOT EXISTS post_images (
  id TEXT PRIMARY KEY NOT NULL,
  post_id TEXT NOT NULL REFERENCES posts (id),
  local_uri TEXT NOT NULL,
  remote_url TEXT,
  position INTEGER NOT NULL,${SYNC_COLUMNS},
  UNIQUE (post_id, local_uri)
);`;
