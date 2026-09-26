import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Onde os dados ficam gravados. Dados sensíveis (senhas) vão para o
// armazenamento criptografado do sistema; o restante, para o AsyncStorage.
export const asyncStorageAdapter = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

export const secureStorageAdapter = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

// Repositório de um valor JSON guardado em uma chave. `fallback` é o valor
// devolvido quando nada foi gravado ainda (uma cópia nova a cada leitura).
export function createJsonStore(
  key,
  { adapter = asyncStorageAdapter, fallback = null } = {}
) {
  const emptyValue = JSON.stringify(fallback);

  const read = async () =>
    JSON.parse((await adapter.getItem(key)) ?? emptyValue);
  const write = (value) => adapter.setItem(key, JSON.stringify(value));

  return {
    read,
    write,
    // Lê, transforma e grava; devolve o valor gravado
    async update(transform) {
      const next = transform(await read());
      await write(next);
      return next;
    },
    clear: () => adapter.removeItem(key),
  };
}

// Executa a ação e, se falhar, acrescenta o contexto à mensagem do erro
export async function withErrorContext(context, action) {
  try {
    return await action();
  } catch (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}
