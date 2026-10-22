import { STORAGE_KEYS } from '../../../shared/constants/storageKeys';
import { createJsonStore } from '../../../shared/services/storage';

// Guarda, por usuário, se o aviso de orientação do feed já foi dispensado
const seenUsersStore = createJsonStore(STORAGE_KEYS.FEED_GUIDE_SEEN, {
  fallback: {},
});

export const guideService = {
  // true se a conta já viu o guia do feed
  async hasSeenFeedGuide(usuario) {
    const seenUsers = await seenUsersStore.read();
    return seenUsers[usuario] === true;
  },

  // Lembra que a conta já viu o guia
  async markFeedGuideSeen(usuario) {
    await seenUsersStore.update((seenUsers) => ({
      ...seenUsers,
      [usuario]: true,
    }));
  },
};
