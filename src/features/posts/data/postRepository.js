import { getDatabase } from '../../../shared/database/connection';
import {
  insertCommand,
  runCommand,
  updateCommand,
} from '../../../shared/database/sqlCommands';
import {
  createdFields,
  deletedFields,
  updatedFields,
} from '../../../shared/database/syncFields';
import { fromPostRow, toPostRow } from './postMapper';
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

async function findById(postId) {
  const database = await getDatabase();
  const row = await database.getFirstAsync(SELECT_ACTIVE_BY_ID, [postId]);
  return row ? fromPostRow(row) : null;
}

// Acesso às tabelas posts e post_images. Quem chama decide se as operações
// rodam numa transação.
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

  // Exclusão lógica: o registro e as fotos continuam no banco como histórico
  async softDelete(postId) {
    await runCommand(
      updateCommand(TABLE, { id: postId, ...deletedFields() }, 'id')
    );
  },
};
