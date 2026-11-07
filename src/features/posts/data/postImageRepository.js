import { getDatabase } from '../../../shared/database/connection';
import {
  runCommand,
  updateCommand,
  upsertCommand,
} from '../../../shared/database/sqlCommands';
import {
  createdFields,
  deletedFields,
  SYNC_STATUS,
} from '../../../shared/database/syncFields';
import { createId } from '../../../shared/utils/id';

const TABLE = 'post_images';

const SELECT_ACTIVE = `
SELECT image.post_id, image.local_uri
FROM post_images AS image
JOIN posts AS post ON post.id = image.post_id
WHERE image.deleted_at IS NULL AND post.deleted_at IS NULL
ORDER BY image.position`;

const SELECT_ACTIVE_OF_POST = `
SELECT id, local_uri, remote_url FROM post_images
WHERE post_id = ? AND deleted_at IS NULL
ORDER BY position`;

const REACTIVATE_BY_REMOTE_URL = `
UPDATE post_images SET position = ?, deleted_at = NULL, updated_at = ?
WHERE post_id = ? AND remote_url = ?`;

function groupByPost(rows) {
  const groups = {};
  for (const { post_id: postId, local_uri: uri } of rows) {
    groups[postId] = [...(groups[postId] || []), uri];
  }
  return groups;
}

const saveImageCommand = (postId, uri, position) =>
  upsertCommand(
    TABLE,
    {
      id: createId(),
      post_id: postId,
      local_uri: uri,
      position,
      ...createdFields(),
    },
    {
      conflictColumns: ['post_id', 'local_uri'],
      updateColumns: ['position', 'deleted_at', 'updated_at', 'sync_status'],
    }
  );

const saveRemoteImageCommand = (postId, url, position) =>
  upsertCommand(
    TABLE,
    {
      id: createId(),
      post_id: postId,
      local_uri: url,
      remote_url: url,
      position,
      ...createdFields(),
      sync_status: SYNC_STATUS.SYNCED,
    },
    {
      conflictColumns: ['post_id', 'local_uri'],
      updateColumns: ['position', 'deleted_at', 'updated_at', 'remote_url'],
    }
  );

const deleteActiveCommand = (postId) => {
  const command = updateCommand(
    TABLE,
    { post_id: postId, ...deletedFields() },
    'post_id'
  );
  return { ...command, sql: `${command.sql} AND deleted_at IS NULL` };
};

export const postImageRepository = {
  async findActiveByPost() {
    const database = await getDatabase();
    return groupByPost(await database.getAllAsync(SELECT_ACTIVE));
  },

  async replace(postId, uris) {
    await runCommand(deleteActiveCommand(postId));
    for (const [position, uri] of uris.entries()) {
      await runCommand(saveImageCommand(postId, uri, position));
    }
  },

  async findActiveOfPost(postId) {
    const database = await getDatabase();
    return database.getAllAsync(SELECT_ACTIVE_OF_POST, [postId]);
  },

  async setRemoteUrl(imageId, url) {
    await runCommand({
      sql: 'UPDATE post_images SET remote_url = ? WHERE id = ?',
      params: [url, imageId],
    });
  },

  async replaceFromRemote(postId, urls) {
    await runCommand(deleteActiveCommand(postId));
    for (const [position, url] of urls.entries()) {
      const { changes } = await runCommand({
        sql: REACTIVATE_BY_REMOTE_URL,
        params: [position, new Date().toISOString(), postId, url],
      });
      if (changes === 0) {
        await runCommand(saveRemoteImageCommand(postId, url, position));
      }
    }
  },
};
