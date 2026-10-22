import { changeAccountPassword } from '../passwordService';
import { authApi } from '../authApi';
import { accountService } from '../accountService';
import { OfflineError } from '../../../../shared/firebase/remoteCall';

jest.mock('../authApi');
jest.mock('../accountService');

const withCode = (code) => Object.assign(new Error(code), { code });

describe('changeAccountPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authApi.currentAccountOf.mockResolvedValue({
      uid: 'uid-1',
      email: 'ana@x.com',
    });
  });

  it('deve trocar a senha no Firebase e depois no aparelho', async () => {
    await changeAccountPassword('ana@x.com', 'nova-senha');

    expect(authApi.currentAccountOf).toHaveBeenCalledWith('ana@x.com');
    expect(authApi.changePassword).toHaveBeenCalledWith('nova-senha');
    expect(accountService.changePassword).toHaveBeenCalledWith(
      'ana@x.com',
      'nova-senha'
    );
  });

  it.each([
    [new OfflineError(), 'Conecte-se à internet para trocar a senha.'],
    [withCode('auth/requires-recent-login'), 'saia e entre de novo'],
    [withCode('auth/weak-password'), 'pelo menos 6 caracteres'],
  ])('deve explicar a falha %#', async (error, message) => {
    authApi.changePassword.mockRejectedValue(error);

    await expect(
      changeAccountPassword('ana@x.com', 'nova-senha')
    ).rejects.toThrow(message);
    expect(accountService.changePassword).not.toHaveBeenCalled();
  });

  it('deve pedir um novo login quando a conta não está conectada no Firebase', async () => {
    authApi.currentAccountOf.mockResolvedValue(null);

    await expect(
      changeAccountPassword('ana@x.com', 'nova-senha')
    ).rejects.toThrow('Entre novamente com sua senha');
    expect(authApi.changePassword).not.toHaveBeenCalled();
  });
});
