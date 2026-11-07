import { getDatabase } from '../shared/database/connection';

export async function clearDatabase() {
  const database = await getDatabase();
  await database.execAsync(
    'DELETE FROM post_images; DELETE FROM posts; DELETE FROM profiles;'
  );
}

export async function selectRows(sql, params = []) {
  const database = await getDatabase();
  return database.getAllAsync(sql, params);
}
