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

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

// O valor lido precisa ter o mesmo "formato" do valor padrão (lista, objeto
// ou número); sem padrão (null), qualquer valor é aceito
function matchesShape(value, fallback) {
  if (fallback === null) return true;
  if (Array.isArray(fallback)) return Array.isArray(value);
  if (isPlainObject(fallback)) return isPlainObject(value);
  return typeof value === typeof fallback;
}

function parseJson(raw) {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false };
  }
}

// Repositório de um valor JSON guardado em uma chave. `fallback` é o valor
// devolvido quando nada foi gravado ainda (uma cópia nova a cada leitura).
// Dados corrompidos ou em outro formato também viram o valor padrão, para o
// app continuar funcionando (e a próxima gravação os substitui).
// `normalize` limpa o valor lido (ex.: descartar itens inválidos da lista).
export function createJsonStore(
  key,
  { adapter = asyncStorageAdapter, fallback = null, normalize = (v) => v } = {}
) {
  const emptyValue = () => JSON.parse(JSON.stringify(fallback));

  const read = async () => {
    const raw = await adapter.getItem(key);
    const parsed = raw === null ? { ok: false } : parseJson(raw);
    const isUsable = parsed.ok && matchesShape(parsed.value, fallback);
    return normalize(isUsable ? parsed.value : emptyValue());
  };
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
