import AsyncStorage from 'expo-sqlite/kv-store';
import * as SecureStore from 'expo-secure-store';

// Onde os dados ficam gravados. Dados sensíveis (senhas) vão para o
// armazenamento criptografado do sistema; o restante, para o armazenamento
// chave-valor do expo-sqlite (mesma interface do AsyncStorage).
export const asyncStorageAdapter = {
  // Lê o valor guardado na chave (null se não houver)
  getItem: (key) => AsyncStorage.getItem(key),
  // Grava o valor (texto) na chave
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  // Apaga o valor da chave
  removeItem: (key) => AsyncStorage.removeItem(key),
};

// Armazenamento criptografado do sistema (senhas)
export const secureStorageAdapter = {
  // Lê o valor guardado na chave (null se não houver)
  getItem: (key) => SecureStore.getItemAsync(key),
  // Grava o valor (texto) na chave
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  // Apaga o valor da chave
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

// Objeto comum { ... } (não é lista nem null)
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

// Lê o JSON guardado sem lançar erro: { ok, value }
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
  // Cópia nova do padrão a cada leitura, lida do JSON guardado uma vez.
  // (structuredClone não é garantido no Hermes, o motor do Expo Go.)
  const emptyJson = JSON.stringify(fallback);
  // Cópia nova do valor padrão
  const emptyValue = () => JSON.parse(emptyJson);

  // Lê o valor guardado; ausente, corrompido ou em outro formato vira o padrão
  const read = async () => {
    const raw = await adapter.getItem(key);
    const parsed = raw === null ? { ok: false } : parseJson(raw);
    const isUsable = parsed.ok && matchesShape(parsed.value, fallback);
    return normalize(isUsable ? parsed.value : emptyValue());
  };
  // Grava o valor como texto JSON
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
    // Apaga o valor guardado
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
