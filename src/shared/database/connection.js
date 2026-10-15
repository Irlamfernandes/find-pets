import * as SQLite from 'expo-sqlite';
import { SCHEMA } from './schema';
import { runMigrations } from './migrations';

const DATABASE_NAME = 'findpets.db';

let opening = null;

async function openAndPrepare() {
  const database = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await database.execAsync(SCHEMA);
  await runMigrations(database);
  return database;
}

// Abre o banco uma única vez; as chamadas seguintes recebem a mesma conexão.
// Se a abertura falhar, a próxima chamada tenta de novo.
export function getDatabase() {
  opening =
    opening ||
    openAndPrepare().catch((error) => {
      opening = null;
      throw error;
    });
  return opening;
}

// Executa as tarefas juntas: se alguma falhar, nenhuma alteração é gravada
export async function inTransaction(task) {
  const database = await getDatabase();
  await database.withTransactionAsync(task);
}
