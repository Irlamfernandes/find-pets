import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../../shared/constants/storageKeys';
import { runStorageMigrations } from '../storageMigrations';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('../../testing/memoryStorage').createAsyncStorageMock()
);
jest.mock('expo-secure-store', () =>
  require('../../testing/memoryStorage').createSecureStoreMock()
);

const asyncData = AsyncStorage.__backend.data;
const secureData = SecureStore.__backend.data;
const save = (data, key, value) => data.set(key, JSON.stringify(value));
const load = (data, key) => JSON.parse(data.get(key));

const ACCOUNT = {
  usuario: 'ana@x.com',
  passwordHash: 'h',
  hasBiometrics: false,
};
const PROFILE = { name: 'Ana', whatsapp: '5511999999999' };

describe('runStorageMigrations', () => {
  beforeEach(() => {
    AsyncStorage.__backend.reset();
    SecureStore.__backend.reset();
  });

  it('deve converter a conta solta em lista e ligar o perfil à conta conectada', async () => {
    save(secureData, STORAGE_KEYS.CREDENTIALS, ACCOUNT);
    save(asyncData, STORAGE_KEYS.PROFILE, PROFILE);
    save(asyncData, STORAGE_KEYS.SESSION, { usuario: 'bia@x.com' });

    await runStorageMigrations();

    expect(load(secureData, STORAGE_KEYS.CREDENTIALS)).toEqual([ACCOUNT]);
    expect(load(asyncData, STORAGE_KEYS.PROFILE)).toEqual({
      'bia@x.com': PROFILE,
    });
    expect(load(asyncData, STORAGE_KEYS.SCHEMA_VERSION)).toBe(1);
  });

  it('deve ligar o perfil solto à primeira conta quando não houver sessão', async () => {
    save(secureData, STORAGE_KEYS.CREDENTIALS, [ACCOUNT]);
    save(asyncData, STORAGE_KEYS.PROFILE, PROFILE);

    await runStorageMigrations();

    expect(load(secureData, STORAGE_KEYS.CREDENTIALS)).toEqual([ACCOUNT]);
    expect(load(asyncData, STORAGE_KEYS.PROFILE)).toEqual({
      'ana@x.com': PROFILE,
    });
  });

  it('deve descartar um perfil solto sem nenhuma conta', async () => {
    save(asyncData, STORAGE_KEYS.PROFILE, PROFILE);

    await runStorageMigrations();

    expect(load(asyncData, STORAGE_KEYS.PROFILE)).toEqual({});
  });

  it('deve manter os dados que já estão no formato atual', async () => {
    const profiles = { 'ana@x.com': PROFILE };
    save(asyncData, STORAGE_KEYS.PROFILE, profiles);

    await runStorageMigrations();

    expect(load(asyncData, STORAGE_KEYS.PROFILE)).toEqual(profiles);
    expect(secureData.has(STORAGE_KEYS.CREDENTIALS)).toBe(false);
  });

  it('deve rodar apenas as migrações pendentes, em ordem', async () => {
    const calls = [];
    const migrations = [
      { version: 3, run: async () => calls.push(3) },
      { version: 1, run: async () => calls.push(1) },
      { version: 2, run: async () => calls.push(2) },
    ];
    save(asyncData, STORAGE_KEYS.SCHEMA_VERSION, 1);

    await runStorageMigrations(migrations);
    await runStorageMigrations(migrations);

    expect(calls).toEqual([2, 3]);
    expect(load(asyncData, STORAGE_KEYS.SCHEMA_VERSION)).toBe(3);
  });
});
