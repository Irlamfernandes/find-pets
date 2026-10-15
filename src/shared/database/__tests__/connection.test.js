import * as SQLite from 'expo-sqlite';
import { getDatabase, inTransaction } from '../connection';

const tableNames = async (database) =>
  (
    await database.getAllAsync(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
    )
  ).map((row) => row.name);

// A conexão fica guardada entre os testes deste arquivo: a ordem importa
describe('connection', () => {
  it('deve tentar abrir de novo depois de uma falha', async () => {
    SQLite.openDatabaseAsync.mockRejectedValueOnce(new Error('sem espaço'));

    await expect(getDatabase()).rejects.toThrow('sem espaço');
    await expect(getDatabase()).resolves.toBeDefined();
    expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('findpets.db');
  });

  it('deve reaproveitar a conexão aberta, já com as tabelas criadas', async () => {
    SQLite.openDatabaseAsync.mockClear();

    const [first, second] = await Promise.all([getDatabase(), getDatabase()]);

    expect(first).toBe(second);
    expect(SQLite.openDatabaseAsync).not.toHaveBeenCalled();
    await expect(tableNames(first)).resolves.toEqual([
      'post_images',
      'posts',
      'profiles',
    ]);
  });

  it('deve desfazer todas as alterações da transação quando uma falha', async () => {
    const database = await getDatabase();
    await database.execAsync('CREATE TABLE notes (text TEXT)');

    await expect(
      inTransaction(async () => {
        await database.runAsync("INSERT INTO notes VALUES ('a')");
        throw new Error('falhou no meio');
      })
    ).rejects.toThrow('falhou no meio');
    await inTransaction(async () => {
      await database.runAsync("INSERT INTO notes VALUES ('b')");
    });

    await expect(database.getAllAsync('SELECT * FROM notes')).resolves.toEqual([
      { text: 'b' },
    ]);
  });
});
