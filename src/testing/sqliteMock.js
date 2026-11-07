const initSqlJs = require('sql.js');

let sqlJsReady = null;

const toParams = (params) =>
  params.length === 1 && Array.isArray(params[0]) ? params[0] : params;

function selectAll(database, source, params) {
  const statement = database.prepare(source);
  statement.bind(toParams(params));
  const rows = [];
  while (statement.step()) rows.push(statement.getAsObject());
  statement.free();
  return rows;
}

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

export function createSQLiteMock() {
  return {
    openDatabaseAsync: jest.fn(async () => {
      sqlJsReady = sqlJsReady || initSqlJs();
      const SQL = await sqlJsReady;
      return createDatabase(new SQL.Database());
    }),
  };
}
