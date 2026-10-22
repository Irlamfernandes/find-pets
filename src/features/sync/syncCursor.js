import { STORAGE_KEYS } from '../../shared/constants/storageKeys';
import { createJsonStore } from '../../shared/services/storage';

// Na primeira sincronização da conta, baixa tudo
export const FIRST_SYNC = 0;

// Até onde cada conta já baixou: { [usuario]: serverUpdatedAt (ms) }
const cursorsStore = createJsonStore(STORAGE_KEYS.SYNC_CURSORS, {
  fallback: {},
});

export const syncCursor = {
  // Até onde a conta já baixou (0 na primeira vez)
  async get(usuario) {
    const cursors = await cursorsStore.read();
    return cursors[usuario] ?? FIRST_SYNC;
  },

  // Guarda até onde a conta já baixou
  save(usuario, cursor) {
    return cursorsStore.update((cursors) => ({
      ...cursors,
      [usuario]: cursor,
    }));
  },
};
