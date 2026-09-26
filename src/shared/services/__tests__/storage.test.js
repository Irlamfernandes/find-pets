import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {
  asyncStorageAdapter,
  secureStorageAdapter,
  createJsonStore,
  withErrorContext,
} from '../storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('adaptadores', () => {
    it('deve repassar as operações ao AsyncStorage', async () => {
      await asyncStorageAdapter.getItem('k');
      await asyncStorageAdapter.setItem('k', 'v');
      await asyncStorageAdapter.removeItem('k');

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('k');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('k', 'v');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('k');
    });

    it('deve repassar as operações ao armazenamento seguro', async () => {
      await secureStorageAdapter.getItem('k');
      await secureStorageAdapter.setItem('k', 'v');
      await secureStorageAdapter.removeItem('k');

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('k');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('k', 'v');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('k');
    });
  });

  describe('createJsonStore', () => {
    const createAdapter = (stored = null) => ({
      getItem: jest.fn().mockResolvedValue(stored),
      setItem: jest.fn().mockResolvedValue(),
      removeItem: jest.fn().mockResolvedValue(),
    });

    it('deve ler o JSON gravado', async () => {
      const adapter = createAdapter('{"a":1}');
      const store = createJsonStore('chave', { adapter });

      await expect(store.read()).resolves.toEqual({ a: 1 });
      expect(adapter.getItem).toHaveBeenCalledWith('chave');
    });

    it('deve devolver uma cópia nova do valor padrão quando não houver dados', async () => {
      const store = createJsonStore('chave', {
        adapter: createAdapter(),
        fallback: [],
      });

      const first = await store.read();
      first.push('alterado');
      await expect(store.read()).resolves.toEqual([]);
    });

    it('deve usar o AsyncStorage e null como padrão', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      await expect(createJsonStore('chave').read()).resolves.toBeNull();
    });

    it('deve gravar, atualizar e limpar o valor', async () => {
      const adapter = createAdapter('[1]');
      const store = createJsonStore('chave', { adapter });

      await store.write({ b: 2 });
      expect(adapter.setItem).toHaveBeenCalledWith('chave', '{"b":2}');

      await expect(store.update((list) => [...list, 2])).resolves.toEqual([
        1, 2,
      ]);
      expect(adapter.setItem).toHaveBeenLastCalledWith('chave', '[1,2]');

      await store.clear();
      expect(adapter.removeItem).toHaveBeenCalledWith('chave');
    });
  });

  describe('withErrorContext', () => {
    it('deve devolver o resultado da ação', async () => {
      await expect(withErrorContext('Contexto', async () => 42)).resolves.toBe(
        42
      );
    });

    it('deve acrescentar o contexto ao erro', async () => {
      await expect(
        withErrorContext('Erro ao salvar', async () => {
          throw new Error('disco cheio');
        })
      ).rejects.toThrow('Erro ao salvar: disco cheio');
    });
  });
});
