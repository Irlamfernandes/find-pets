import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storageKeys';

// Guarda, por usuário, se o aviso de orientação do feed já foi dispensado
async function readSeenUsers() {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.FEED_GUIDE_SEEN);
  return data ? JSON.parse(data) : {};
}

export const guideService = {
  async hasSeenFeedGuide(usuario) {
    const seenUsers = await readSeenUsers();
    return seenUsers[usuario] === true;
  },

  async markFeedGuideSeen(usuario) {
    const seenUsers = await readSeenUsers();
    await AsyncStorage.setItem(
      STORAGE_KEYS.FEED_GUIDE_SEEN,
      JSON.stringify({ ...seenUsers, [usuario]: true })
    );
  },
};
