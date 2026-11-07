import { getDatabase } from './connection';

const placeholders = (count) => new Array(count).fill('?').join(', ');

export function insertCommand(table, row) {
  const columns = Object.keys(row);
  return {
    sql: `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders(columns.length)})`,
    params: Object.values(row),
  };
}

export function updateCommand(table, row, keyColumn) {
  const { [keyColumn]: key, ...changes } = row;
  const assignments = Object.keys(changes).map((column) => `${column} = ?`);
  return {
    sql: `UPDATE ${table} SET ${assignments.join(', ')} WHERE ${keyColumn} = ?`,
    params: [...Object.values(changes), key],
  };
}

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
