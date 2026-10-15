import {
  insertCommand,
  updateCommand,
  upsertCommand,
  runCommand,
} from '../sqlCommands';
import { getDatabase } from '../connection';

describe('sqlCommands', () => {
  it('deve montar o INSERT com um parâmetro por coluna', () => {
    expect(insertCommand('pets', { id: '1', name: 'Rex' })).toEqual({
      sql: 'INSERT INTO pets (id, name) VALUES (?, ?)',
      params: ['1', 'Rex'],
    });
  });

  it('deve montar o UPDATE com a chave por último', () => {
    expect(updateCommand('pets', { name: 'Rex', id: '1' }, 'id')).toEqual({
      sql: 'UPDATE pets SET name = ? WHERE id = ?',
      params: ['Rex', '1'],
    });
  });

  it('deve montar o UPSERT atualizando só as colunas indicadas', () => {
    const command = upsertCommand(
      'pets',
      { id: '1', name: 'Rex' },
      { conflictColumns: ['id'], updateColumns: ['name'] }
    );

    expect(command).toEqual({
      sql: 'INSERT INTO pets (id, name) VALUES (?, ?) ON CONFLICT (id) DO UPDATE SET name = excluded.name',
      params: ['1', 'Rex'],
    });
  });

  it('deve executar o comando no banco', async () => {
    const database = await getDatabase();
    await database.execAsync(
      'CREATE TABLE pets (id TEXT PRIMARY KEY, name TEXT)'
    );

    await runCommand(insertCommand('pets', { id: '1', name: 'Rex' }));
    await runCommand(updateCommand('pets', { id: '1', name: 'Bob' }, 'id'));

    await expect(database.getAllAsync('SELECT * FROM pets')).resolves.toEqual([
      { id: '1', name: 'Bob' },
    ]);
  });
});
