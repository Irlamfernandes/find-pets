import {
  readValue,
  writeValue,
} from '../../../shared/firebase/realtimeDatabase';

// Perfil de cada conta no Realtime Database: profiles/<uid>
const pathOf = (uid) => `profiles/${uid}`;

export const profileApi = {
  // Perfil da conta na nuvem, ou null se ela ainda não tiver um
  get(uid) {
    return readValue(pathOf(uid));
  },

  save(uid, profile) {
    return writeValue(pathOf(uid), profile);
  },
};
