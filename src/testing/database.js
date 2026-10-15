import { getDatabase } from '../shared/database/connection';

// Apaga as linhas de todas as tabelas, para cada teste começar do zero
export async function clearDatabase() {
  const database = await getDatabase();
  await database.execAsync(
    'DELETE FROM post_images; DELETE FROM posts; DELETE FROM profiles;'
  );
}

// Lê as linhas gravadas, incluindo as excluídas (exclusão lógica)
export async function selectRows(sql, params = []) {
  const database = await getDatabase();
  return database.getAllAsync(sql, params);
}
