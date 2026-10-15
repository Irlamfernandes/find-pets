import * as SQLite from 'expo-sqlite';
import { runMigrations } from '../migrations';
import { getDatabase } from '../connection';

const userVersion = async (database) =>
  (await database.getFirstAsync('PRAGMA user_version')).user_version;

describe('migrations', () => {
  it('deve deixar o banco do app na versão mais nova', async () => {
    const database = await getDatabase();

    const columns = await database.getAllAsync('PRAGMA table_info(profiles)');

    expect(columns.map((column) => column.name)).toContain('photo_remote_url');
    await expect(userVersion(database)).resolves.toBe(1);
  });

  it('deve rodar só as migrações que faltam, uma única vez', async () => {
    const database = await SQLite.openDatabaseAsync('teste');
    await database.execAsync('CREATE TABLE pets (name TEXT);');
    const migrations = [
      'ALTER TABLE pets ADD COLUMN age INTEGER;',
      'ALTER TABLE pets ADD COLUMN color TEXT;',
    ];

    await runMigrations(database, migrations.slice(0, 1));
    await runMigrations(database, migrations);
    await runMigrations(database, migrations);

    const columns = await database.getAllAsync('PRAGMA table_info(pets)');
    expect(columns.map((column) => column.name)).toEqual([
      'name',
      'age',
      'color',
    ]);
    await expect(userVersion(database)).resolves.toBe(2);
  });
});
