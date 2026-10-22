import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from 'firebase/auth';
import { auth } from '../../../shared/firebase/firebaseApp';
import { remoteCall } from '../../../shared/firebase/remoteCall';
import { normalizeEmail } from '../../../shared/utils/validation';

// Contas no Firebase Authentication. Cadastro e login devolvem o e-mail da
// conta; o Firebase guarda o login no aparelho.
export const authApi = {
  // Cria a conta no Firebase (já entra nela)
  async register(email, password) {
    const { user } = await remoteCall(() =>
      createUserWithEmailAndPassword(auth, email, password)
    );
    return user.email;
  },

  // Entra na conta conferindo a senha no Firebase
  async login(email, password) {
    const { user } = await remoteCall(() =>
      signInWithEmailAndPassword(auth, email, password)
    );
    return user.email;
  },

  // Conta conectada no Firebase, se for a do `usuario`: { uid, email } ou null
  async currentAccountOf(usuario) {
    await auth.authStateReady();
    const user = auth.currentUser;
    const isSameUser =
      Boolean(user) && normalizeEmail(user.email) === normalizeEmail(usuario);
    return isSameUser ? { uid: user.uid, email: user.email } : null;
  },

  // Troca a senha da conta conectada no Firebase
  changePassword(newPassword) {
    return remoteCall(() => updatePassword(auth.currentUser, newPassword));
  },

  // Sai da conta no Firebase
  signOut() {
    return signOut(auth);
  },
};
