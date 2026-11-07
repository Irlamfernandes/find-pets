import { STORAGE_KEYS } from '../../shared/constants/storageKeys';
import { createJsonStore } from '../../shared/services/storage';

export const FIRST_SYNC = 0;

const cursorsStore = createJsonStore(STORAGE_KEYS.SYNC_CURSORS, {
  fallback: {},
});

export const syncCursor = {
  async get(usuario) {
    const cursors = await cursorsStore.read();
    return cursors[usuario] ?? FIRST_SYNC;
  },

  save(usuario, cursor) {
    return cursorsStore.update((cursors) => ({
      ...cursors,
      [usuario]: cursor,
    }));
  },
};
