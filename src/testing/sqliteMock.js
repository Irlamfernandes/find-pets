// Banco SQLite em memória para os testes. O expo-sqlite depende do código
// nativo do celular; aqui o mesmo contrato é atendido pelo sql.js (o SQLite
// compilado para JavaScript), então os comandos SQL rodam de verdade.
const initSqlJs = require('sql.js');

let sqlJsReady = null;

// Aceita os dois formatos do expo-sqlite: runAsync(sql, [a, b]) e
// runAsync(sql, a, b)
const toParams = (params) =>
  params.length === 1 && Array.isArray(params[0]) ? params[0] : params;

// Executa um SELECT e devolve as linhas como objetos
function selectAll(database, source, params) {
  const statement = database.prepare(source);
  statement.bind(toParams(params));
  const rows = [];
  while (statement.step()) rows.push(statement.getAsObject());
  statement.free();
  return rows;
}

// Executa a tarefa numa transação: desfaz tudo se ela falhar
async function runInTransaction(database, task) {
  database.exec('BEGIN');
  try {
    await task();
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

// Banco com os métodos do expo-sqlite usados pelo app
function createDatabase(database) {
  return {
    execAsync: jest.fn(async (source) => {
      database.exec(source);
    }),
    runAsync: jest.fn(async (source, ...params) => {
      database.run(source, toParams(params));
      return { changes: database.getRowsModified() };
    }),
    getAllAsync: jest.fn(async (source, ...params) =>
      selectAll(database, source, params)
    ),
    getFirstAsync: jest.fn(
      async (source, ...params) =>
        selectAll(database, source, params)[0] ?? null
    ),
    withTransactionAsync: jest.fn((task) => runInTransaction(database, task)),
  };
}

// Substituto do módulo expo-sqlite
export function createSQLiteMock() {
  return {
    openDatabaseAsync: jest.fn(async () => {
      sqlJsReady = sqlJsReady || initSqlJs();
      const SQL = await sqlJsReady;
      return createDatabase(new SQL.Database());
    }),
  };
}
