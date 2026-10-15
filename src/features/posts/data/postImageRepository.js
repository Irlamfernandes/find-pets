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

// Fotos ativas de registros ativos, na ordem em que foram escolhidas
const SELECT_ACTIVE = `
SELECT image.post_id, image.local_uri
FROM post_images AS image
JOIN posts AS post ON post.id = image.post_id
WHERE image.deleted_at IS NULL AND post.deleted_at IS NULL
ORDER BY image.position`;

// Fotos ativas de um registro, com o endereço no servidor (se já enviadas)
const SELECT_ACTIVE_OF_POST = `
SELECT id, local_uri, remote_url FROM post_images
WHERE post_id = ? AND deleted_at IS NULL
ORDER BY position`;

// Foto enviada por este celular que voltou do servidor: continua usando o
// arquivo local (abre sem internet)
const REACTIVATE_BY_REMOTE_URL = `
UPDATE post_images SET position = ?, deleted_at = NULL, updated_at = ?
WHERE post_id = ? AND remote_url = ?`;

// [{ post_id, local_uri }] -> { [post_id]: [local_uri, ...] }
function groupByPost(rows) {
  const groups = {};
  for (const { post_id: postId, local_uri: uri } of rows) {
    groups[postId] = [...(groups[postId] || []), uri];
  }
  return groups;
}

// Grava a foto na posição informada. Se ela já existia no registro (mesmo
// excluída antes), volta a ficar ativa, mantendo o id e a data de criação.
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

// Foto que veio do servidor (de outro celular): o endereço dela é a URL
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

// Exclusão lógica de todas as fotos ativas do registro
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

  // Deixa o registro com exatamente estas fotos, nesta ordem. As que saíram
  // continuam no banco, marcadas como excluídas (histórico).
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

  // Deixa o registro com as fotos que vieram do servidor, nesta ordem
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
