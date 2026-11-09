import { getDatabase } from '../../../shared/database/connection';
import {
  insertCommand,
  runCommand,
  updateCommand,
  upsertCommand,
} from '../../../shared/database/sqlCommands';
import {
  createdFields,
  deletedFields,
  updatedFields,
} from '../../../shared/database/syncFields';
import {
  fromApiPost,
  fromPostRow,
  POST_COLUMNS,
  toPostRow,
} from './postMapper';
import { postImageRepository } from './postImageRepository';

const TABLE = 'posts';

const SELECT_ACTIVE = `
SELECT * FROM posts
WHERE deleted_at IS NULL
ORDER BY created_at DESC, rowid DESC`;

const SELECT_ACTIVE_BY_ID = `
SELECT * FROM posts WHERE id = ? AND deleted_at IS NULL`;

const SELECT_PENDING = `
SELECT * FROM posts WHERE sync_status = 'pending' ORDER BY rowid`;

const SYNCED_UPSERT_OPTIONS = {
  conflictColumns: ['id'],
  updateColumns: [
    ...POST_COLUMNS.filter((column) => column !== 'id'),
    'updated_at',
    'deleted_at',
    'sync_status',
  ],
};

async function findById(postId) {
  const database = await getDatabase();
  const row = await database.getFirstAsync(SELECT_ACTIVE_BY_ID, [postId]);
  return row ? fromPostRow(row) : null;
}

export const postRepository = {
  async findActive() {
    const database = await getDatabase();
    const [rows, imagesByPost] = await Promise.all([
      database.getAllAsync(SELECT_ACTIVE),
      postImageRepository.findActiveByPost(),
    ]);
    return rows.map((row) => fromPostRow(row, imagesByPost[row.id] || []));
  },

  async insert(post) {
    await runCommand(
      insertCommand(TABLE, { ...toPostRow(post), ...createdFields() })
    );
    await postImageRepository.replace(post.id, post.images);
  },

  async update(postId, changes) {
    const current = await findById(postId);
    if (!current) return;

    const row = toPostRow({ ...current, ...changes, id: postId });
    await runCommand(
      updateCommand(TABLE, { ...row, ...updatedFields() }, 'id')
    );
    if (changes.images)
      await postImageRepository.replace(postId, changes.images);
  },

  async findPendingRows() {
    const database = await getDatabase();
    return database.getAllAsync(SELECT_PENDING);
  },

  async findUpdatedAt(postId) {
    const database = await getDatabase();
    const row = await database.getFirstAsync(
      'SELECT updated_at FROM posts WHERE id = ?',
      [postId]
    );
    return row?.updated_at ?? null;
  },

  async saveSynced(remote) {
    await runCommand(
      upsertCommand(TABLE, fromApiPost(remote), SYNCED_UPSERT_OPTIONS)
    );
    await postImageRepository.replaceFromRemote(remote.id, remote.images);
  },

  async softDelete(postId) {
    await runCommand(
      updateCommand(TABLE, { id: postId, ...deletedFields() }, 'id')
    );
  },
};
