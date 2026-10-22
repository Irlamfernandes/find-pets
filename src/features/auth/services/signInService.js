import { OfflineError } from '../../../shared/firebase/remoteCall';
import { accountService } from './accountService';
import { authApi } from './authApi';
import { friendlyAuthError, isWrongCredentials } from './authErrors';

// Entrada na conta. O Firebase é quem confere a senha, o que permite entrar
// em qualquer celular. A conta também fica guardada neste aparelho, para
// reabrir o app sem internet.

// Guarda a conta no aparelho e devolve o e-mail dela
async function remember(email, password) {
  await accountService.rememberAccount(email, password);
  return email;
}

// Cadastro precisa de internet: a conta é criada no Firebase.
// Devolve o e-mail da conta.
export async function signUp(email, password) {
  try {
    return await remember(await authApi.register(email, password), password);
  } catch (error) {
    if (error instanceof OfflineError) {
      throw new Error('Sem conexão. Conecte-se à internet para criar a conta.');
    }
    throw friendlyAuthError(error);
  }
}

// Sem conexão, confere a senha guardada neste aparelho
function signInOffline(error, email, password) {
  if (error instanceof OfflineError) {
    return accountService.authenticate(email, password);
  }
  if (isWrongCredentials(error)) return null;
  throw friendlyAuthError(error);
}

// Devolve o e-mail da conta, ou null quando a senha não confere
export async function signIn(email, password) {
  try {
    return await remember(await authApi.login(email, password), password);
  } catch (error) {
    return signInOffline(error, email, password);
  }
}

// Sai da conta também no Firebase (para de sincronizar até o próximo login)
export const signOut = () => authApi.signOut();
