import { HttpError, OfflineError } from '../../../shared/api/httpClient';
import { accountService } from './accountService';
import { authApi } from './authApi';
import { tokenStorage } from './tokenStorage';

// Entrada na conta. A API é quem confere a senha, o que permite entrar em
// qualquer celular. A conta também fica guardada neste aparelho, para
// reabrir o app sem internet.

async function remember({ token, email }, password) {
  await accountService.rememberAccount(email, password);
  await tokenStorage.save(email, token);
}

// Cadastro precisa de internet: a conta é criada no servidor.
// Devolve o e-mail da conta.
export async function signUp(email, password) {
  try {
    const session = await authApi.register(email, password);
    await remember(session, password);
    return session.email;
  } catch (error) {
    if (error instanceof OfflineError) {
      throw new Error('Sem conexão. Conecte-se à internet para criar a conta.');
    }
    throw error;
  }
}

// Sem conexão, confere a senha guardada neste aparelho
function signInOffline(error, email, password) {
  if (error instanceof OfflineError) {
    return accountService.authenticate(email, password);
  }
  if (error instanceof HttpError && error.status === 401) return null;
  throw error;
}

// Devolve o e-mail da conta, ou null quando a senha não confere
export async function signIn(email, password) {
  try {
    const session = await authApi.login(email, password);
    await remember(session, password);
    return session.email;
  } catch (error) {
    return signInOffline(error, email, password);
  }
}
