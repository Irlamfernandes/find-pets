import {
  readValue,
  writeValue,
} from '../../../shared/firebase/realtimeDatabase';

const pathOf = (uid) => `profiles/${uid}`;

export const profileApi = {
  get(uid) {
    return readValue(pathOf(uid));
  },

  save(uid, profile) {
    return writeValue(pathOf(uid), profile);
  },
};
