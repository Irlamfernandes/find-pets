import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from 'firebase/auth';
import { auth } from '../../../shared/firebase/firebaseApp';
import { remoteCall } from '../../../shared/firebase/remoteCall';
import { normalizeEmail } from '../../../shared/utils/validation';

export const authApi = {
  async register(email, password) {
    const { user } = await remoteCall(() =>
      createUserWithEmailAndPassword(auth, email, password)
    );
    return user.email;
  },

  async login(email, password) {
    const { user } = await remoteCall(() =>
      signInWithEmailAndPassword(auth, email, password)
    );
    return user.email;
  },

  async currentAccountOf(usuario) {
    await auth.authStateReady();
    const user = auth.currentUser;
    const isSameUser =
      Boolean(user) && normalizeEmail(user.email) === normalizeEmail(usuario);
    return isSameUser ? { uid: user.uid, email: user.email } : null;
  },

  changePassword(newPassword) {
    return remoteCall(() => updatePassword(auth.currentUser, newPassword));
  },

  signOut() {
    return signOut(auth);
  },
};
