// Mudanças na estrutura do banco depois da primeira versão das tabelas.
// O "CREATE TABLE IF NOT EXISTS" não altera tabelas que já existem no
// celular; por isso cada mudança vira uma migração, que roda uma única vez.
// O número da versão fica guardado no próprio banco (PRAGMA user_version).
// Nunca altere uma migração já publicada: acrescente outra no fim da lista.
export const MIGRATIONS = [
  // 1: endereço da foto de perfil no servidor (evita reenviar a mesma foto)
  'ALTER TABLE profiles ADD COLUMN photo_remote_url TEXT;',
];

// Aplica, em ordem, as migrações mais novas que a versão gravada no banco
// (PRAGMA user_version) e atualiza a versão a cada uma
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
