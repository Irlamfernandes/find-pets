import { OfflineError } from '../../../shared/firebase/remoteCall';
import { accountService } from './accountService';
import { authApi } from './authApi';
import { friendlyAuthError, isWrongCredentials } from './authErrors';

async function remember(email, password) {
  await accountService.rememberAccount(email, password);
  return email;
}

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

function signInOffline(error, email, password) {
  if (error instanceof OfflineError) {
    return accountService.authenticate(email, password);
  }
  if (isWrongCredentials(error)) return null;
  throw friendlyAuthError(error);
}

export async function signIn(email, password) {
  try {
    return await remember(await authApi.login(email, password), password);
  } catch (error) {
    return signInOffline(error, email, password);
  }
}

export const signOut = () => authApi.signOut();
