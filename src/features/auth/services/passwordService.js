import { OfflineError } from '../../../shared/api/httpClient';
import { accountService } from './accountService';
import { authApi } from './authApi';
import { tokenStorage } from './tokenStorage';

// Troca a senha no servidor (vale para todos os celulares) e depois neste
// aparelho. Precisa de internet, senão as senhas ficariam diferentes.
export async function changeAccountPassword(usuario, newPassword) {
  const token = await tokenStorage.get(usuario);
  if (!token) {
    throw new Error('Entre novamente com sua senha para poder trocá-la.');
  }

  try {
    await authApi.changePassword(token, newPassword);
  } catch (error) {
    if (error instanceof OfflineError) {
      throw new Error('Conecte-se à internet para trocar a senha.');
    }
    throw error;
  }
  await accountService.changePassword(usuario, newPassword);
}
