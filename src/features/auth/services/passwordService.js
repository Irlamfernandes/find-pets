import { OfflineError } from '../../../shared/firebase/remoteCall';
import { accountService } from './accountService';
import { authApi } from './authApi';
import { friendlyAuthError } from './authErrors';

// Converte a falha da troca de senha numa mensagem para o usuário
function toPasswordError(error) {
  if (error instanceof OfflineError) {
    return new Error('Conecte-se à internet para trocar a senha.');
  }
  return friendlyAuthError(error);
}

// Troca a senha no Firebase (vale para todos os celulares) e depois neste
// aparelho. Precisa de internet, senão as senhas ficariam diferentes.
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
