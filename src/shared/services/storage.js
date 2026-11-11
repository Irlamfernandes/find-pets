import AsyncStorage from 'expo-sqlite/kv-store';
import * as SecureStore from 'expo-secure-store';

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

export function createJsonStore(
  key,
  { adapter = asyncStorageAdapter, fallback = null, normalize = (v) => v } = {}
) {
  const emptyJson = JSON.stringify(fallback);
  const emptyValue = () => JSON.parse(emptyJson);

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
    async update(transform) {
      const next = transform(await read());
      await write(next);
      return next;
    },
    clear: () => adapter.removeItem(key),
  };
}

export async function withErrorContext(context, action) {
  try {
    return await action();
  } catch (error) {
    throw new Error(`${context}: ${error.message}`, { cause: error });
  }
}
