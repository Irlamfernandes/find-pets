import { STORAGE_KEYS } from '../../shared/constants/storageKeys';
import { createJsonStore } from '../../shared/services/storage';

// Na primeira sincronização da conta, baixa tudo
export const FIRST_SYNC = '1970-01-01T00:00:00.000Z';

// Até onde cada conta já baixou: { [usuario]: serverUpdatedAt }
const cursorsStore = createJsonStore(STORAGE_KEYS.SYNC_CURSORS, {
  fallback: {},
});

export const syncCursor = {
  async get(usuario) {
    const cursors = await cursorsStore.read();
    return cursors[usuario] || FIRST_SYNC;
  },

  save(usuario, cursor) {
    return cursorsStore.update((cursors) => ({
      ...cursors,
      [usuario]: cursor,
    }));
  },
};
