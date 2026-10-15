import { getDatabase } from './connection';

// Monta comandos SQL a partir de uma linha { coluna: valor }. Os nomes das
// colunas vêm sempre do código; os valores vão como parâmetros "?", o que
// impede SQL injection.

const placeholders = (count) => new Array(count).fill('?').join(', ');

export function insertCommand(table, row) {
  const columns = Object.keys(row);
  return {
    sql: `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders(columns.length)})`,
    params: Object.values(row),
  };
}

// Atualiza a linha cuja coluna-chave (`keyColumn`) tem o valor da linha
export function updateCommand(table, row, keyColumn) {
  const { [keyColumn]: key, ...changes } = row;
  const assignments = Object.keys(changes).map((column) => `${column} = ?`);
  return {
    sql: `UPDATE ${table} SET ${assignments.join(', ')} WHERE ${keyColumn} = ?`,
    params: [...Object.values(changes), key],
  };
}

// Insere ou, se já existir uma linha com o mesmo valor em `conflictColumns`,
// atualiza apenas `updateColumns` (preservando id e created_at)
export function upsertCommand(table, row, { conflictColumns, updateColumns }) {
  const insert = insertCommand(table, row);
  const updates = updateColumns.map(
    (column) => `${column} = excluded.${column}`
  );
  return {
    sql: `${insert.sql} ON CONFLICT (${conflictColumns.join(', ')}) DO UPDATE SET ${updates.join(', ')}`,
    params: insert.params,
  };
}

export async function runCommand({ sql, params }) {
  const database = await getDatabase();
  return database.runAsync(sql, params);
}
