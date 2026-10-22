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

// Mais novos primeiro; registros criados no mesmo instante seguem a ordem
// em que foram gravados (rowid)
const SELECT_ACTIVE = `
SELECT * FROM posts
WHERE deleted_at IS NULL
ORDER BY created_at DESC, rowid DESC`;

const SELECT_ACTIVE_BY_ID = `
SELECT * FROM posts WHERE id = ? AND deleted_at IS NULL`;

// Registros alterados neste celular que ainda não foram para o servidor
// (inclusive os excluídos)
const SELECT_PENDING = `
SELECT * FROM posts WHERE sync_status = 'pending' ORDER BY rowid`;

// Ao gravar o que veio do servidor, só a data de criação não muda
const SYNCED_UPSERT_OPTIONS = {
  conflictColumns: ['id'],
  updateColumns: [
    ...POST_COLUMNS.filter((column) => column !== 'id'),
    'updated_at',
    'deleted_at',
    'sync_status',
  ],
};

// Registro ativo pelo id, ou null
async function findById(postId) {
  const database = await getDatabase();
  const row = await database.getFirstAsync(SELECT_ACTIVE_BY_ID, [postId]);
  return row ? fromPostRow(row) : null;
}

// Acesso às tabelas posts e post_images. Quem chama decide se as operações
// rodam numa transação.
export const postRepository = {
  // Registros ativos com as fotos, do mais novo para o mais antigo
  async findActive() {
    const database = await getDatabase();
    const [rows, imagesByPost] = await Promise.all([
      database.getAllAsync(SELECT_ACTIVE),
      postImageRepository.findActiveByPost(),
    ]);
    return rows.map((row) => fromPostRow(row, imagesByPost[row.id] || []));
  },

  // Grava um registro novo e as fotos dele (fica pendente de envio)
  async insert(post) {
    await runCommand(
      insertCommand(TABLE, { ...toPostRow(post), ...createdFields() })
    );
    await postImageRepository.replace(post.id, post.images);
  },

  // Aplica `changes` ao registro (o id não muda). Fotos só são trocadas
  // quando `changes.images` é informado. Registro inexistente é ignorado.
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

  // Linhas pendentes de envio para a nuvem
  async findPendingRows() {
    const database = await getDatabase();
    return database.getAllAsync(SELECT_PENDING);
  },

  // Data da última alteração do registro (para saber se mudou durante o envio)
  async findUpdatedAt(postId) {
    const database = await getDatabase();
    const row = await database.getFirstAsync(
      'SELECT updated_at FROM posts WHERE id = ?',
      [postId]
    );
    return row?.updated_at ?? null;
  },

  // Grava o registro como está no servidor (já sincronizado)
  async saveSynced(remote) {
    await runCommand(
      upsertCommand(TABLE, fromApiPost(remote), SYNCED_UPSERT_OPTIONS)
    );
    await postImageRepository.replaceFromRemote(remote.id, remote.images);
  },

  // Exclusão lógica: o registro e as fotos continuam no banco como histórico
  async softDelete(postId) {
    await runCommand(
      updateCommand(TABLE, { id: postId, ...deletedFields() }, 'id')
    );
  },
};
