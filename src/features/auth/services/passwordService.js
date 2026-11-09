import { OfflineError } from '../../../shared/firebase/remoteCall';
import { accountService } from './accountService';
import { authApi } from './authApi';
import { friendlyAuthError } from './authErrors';

function toPasswordError(error) {
  if (error instanceof OfflineError) {
    return new Error('Conecte-se à internet para trocar a senha.');
  }
  return friendlyAuthError(error);
}

export async function changeAccountPassword(usuario, newPassword) {
  if (!(await authApi.currentAccountOf(usuario))) {
    throw new Error('Entre novamente com sua senha para poder trocá-la.');
  }

  try {
    await authApi.changePassword(newPassword);
  } catch (error) {
    throw toPasswordError(error);
  }
  await accountService.changePassword(usuario, newPassword);
}
