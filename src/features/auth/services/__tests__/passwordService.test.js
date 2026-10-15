import { changeAccountPassword } from '../passwordService';
import { authApi } from '../authApi';
import { accountService } from '../accountService';
import { tokenStorage } from '../tokenStorage';
import { HttpError, OfflineError } from '../../../../shared/api/httpClient';

jest.mock('../authApi');
jest.mock('../accountService');
jest.mock('../tokenStorage');

describe('changeAccountPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tokenStorage.get.mockResolvedValue('token-ana');
  });

  it('deve trocar a senha no servidor e depois no aparelho', async () => {
    await changeAccountPassword('ana@x.com', 'nova');

    expect(authApi.changePassword).toHaveBeenCalledWith('token-ana', 'nova');
    expect(accountService.changePassword).toHaveBeenCalledWith(
      'ana@x.com',
      'nova'
    );
  });

  it('deve exigir internet, para as senhas não ficarem diferentes', async () => {
    authApi.changePassword.mockRejectedValue(new OfflineError());

    await expect(changeAccountPassword('ana@x.com', 'nova')).rejects.toThrow(
      'Conecte-se à internet para trocar a senha.'
    );
    expect(accountService.changePassword).not.toHaveBeenCalled();
  });

  it('deve repassar a recusa do servidor', async () => {
    authApi.changePassword.mockRejectedValue(new HttpError(401, 'Expirou.'));

    await expect(changeAccountPassword('ana@x.com', 'nova')).rejects.toThrow(
      'Expirou.'
    );
  });

  it('deve pedir um novo login quando não houver token', async () => {
    tokenStorage.get.mockResolvedValue(null);

    await expect(changeAccountPassword('ana@x.com', 'nova')).rejects.toThrow(
      'Entre novamente com sua senha'
    );
    expect(authApi.changePassword).not.toHaveBeenCalled();
  });
});
