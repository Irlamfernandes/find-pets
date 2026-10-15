import { STORAGE_KEYS } from '../../../shared/constants/storageKeys';
import {
  createJsonStore,
  secureStorageAdapter,
} from '../../../shared/services/storage';
import { normalizeEmail } from '../../../shared/utils/validation';

// Token de acesso à API de cada conta deste aparelho: { [usuario]: token }.
// Fica no armazenamento criptografado, como as senhas.
const tokensStore = createJsonStore(STORAGE_KEYS.API_TOKENS, {
  adapter: secureStorageAdapter,
  fallback: {},
});

const keyOf = (usuario) => normalizeEmail(usuario);

export const tokenStorage = {
  async get(usuario) {
    const tokens = await tokensStore.read();
    return tokens[keyOf(usuario)] || null;
  },

  save(usuario, token) {
    return tokensStore.update((tokens) => ({
      ...tokens,
      [keyOf(usuario)]: token,
    }));
  },

  // Token expirado ou recusado: só um novo login com senha gera outro
  remove(usuario) {
    return tokensStore.update((tokens) => {
      const remaining = { ...tokens };
      delete remaining[keyOf(usuario)];
      return remaining;
    });
  },
};
