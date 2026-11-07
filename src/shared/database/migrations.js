export const MIGRATIONS = [
  'ALTER TABLE profiles ADD COLUMN photo_remote_url TEXT;',
];

export async function runMigrations(database, migrations = MIGRATIONS) {
  const { user_version: version } = await database.getFirstAsync(
    'PRAGMA user_version'
  );
  for (const [index, sql] of migrations.entries()) {
    if (index >= version) {
      await database.execAsync(`${sql} PRAGMA user_version = ${index + 1};`);
    }
  }
}
