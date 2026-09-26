import { STORAGE_KEYS } from '../shared/constants/storageKeys';
import {
  createJsonStore,
  secureStorageAdapter,
} from '../shared/services/storage';

// Cada migração converte os dados gravados por versões antigas do app para o
// formato atual. Rodam uma única vez, em ordem, ao abrir o app; assim os
// serviços só precisam conhecer o formato atual.

const schemaStore = createJsonStore(STORAGE_KEYS.SCHEMA_VERSION, {
  fallback: 0,
});
const accountsStore = createJsonStore(STORAGE_KEYS.CREDENTIALS, {
  adapter: secureStorageAdapter,
});
const profilesStore = createJsonStore(STORAGE_KEYS.PROFILE);
const sessionStore = createJsonStore(STORAGE_KEYS.SESSION);

// Uma conta única era gravada como objeto solto, e não em lista
async function migrateAccountsToList() {
  const accounts = await accountsStore.read();
  if (accounts && !Array.isArray(accounts)) {
    await accountsStore.write([accounts]);
  }
  return Array.isArray(accounts) ? accounts : [accounts].filter(Boolean);
}

// O perfil de quem usava o app sozinho era gravado solto ({ name, ... }),
// sem indicar a conta. Ele passa a pertencer à conta conectada (ou à única
// cadastrada); sem conta nenhuma, é descartado.
async function findProfileOwner(accounts) {
  const session = await sessionStore.read();
  return session?.usuario || accounts[0]?.usuario || null;
}

async function migrateProfilesByAccount(accounts) {
  const profiles = await profilesStore.read();
  if (!profiles?.name) return;

  const owner = await findProfileOwner(accounts);
  await profilesStore.write(owner ? { [owner]: profiles } : {});
}

export const MIGRATIONS = [
  {
    version: 1,
    run: async () => migrateProfilesByAccount(await migrateAccountsToList()),
  },
];

export async function runStorageMigrations(migrations = MIGRATIONS) {
  const currentVersion = await schemaStore.read();
  const pending = migrations
    .filter((migration) => migration.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    await migration.run();
    await schemaStore.write(migration.version);
  }
}
