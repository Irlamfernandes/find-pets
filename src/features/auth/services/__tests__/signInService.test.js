import { signIn, signOut, signUp } from '../signInService';
import { authApi } from '../authApi';
import { accountService } from '../accountService';
import { OfflineError } from '../../../../shared/firebase/remoteCall';

jest.mock('../authApi');
jest.mock('../accountService');

const withCode = (code) => Object.assign(new Error(code), { code });

describe('signInService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('signUp', () => {
    it('deve criar a conta no Firebase e guardá-la no aparelho', async () => {
      authApi.register.mockResolvedValue('ana@x.com');

      await expect(signUp('Ana@x.com', 'senha123')).resolves.toBe('ana@x.com');

      expect(authApi.register).toHaveBeenCalledWith('Ana@x.com', 'senha123');
      expect(accountService.rememberAccount).toHaveBeenCalledWith(
        'ana@x.com',
        'senha123'
      );
    });

    it('deve exigir internet para criar a conta', async () => {
      authApi.register.mockRejectedValue(new OfflineError());

      await expect(signUp('ana@x.com', 'senha123')).rejects.toThrow(
        'Conecte-se à internet para criar a conta.'
      );
      expect(accountService.rememberAccount).not.toHaveBeenCalled();
    });

    it('deve explicar a recusa do Firebase (ex.: e-mail já cadastrado)', async () => {
      authApi.register.mockRejectedValue(withCode('auth/email-already-in-use'));

      await expect(signUp('ana@x.com', 'senha123')).rejects.toThrow(
        'Este e-mail já está cadastrado. Faça login.'
      );
    });
  });

  describe('signIn', () => {
    it('deve entrar pelo Firebase e guardar a conta no aparelho', async () => {
      authApi.login.mockResolvedValue('ana@x.com');

      await expect(signIn('ana@x.com', 'senha123')).resolves.toBe('ana@x.com');

      expect(accountService.rememberAccount).toHaveBeenCalledWith(
        'ana@x.com',
        'senha123'
      );
      expect(accountService.authenticate).not.toHaveBeenCalled();
    });

    it('deve devolver null quando o Firebase recusa a senha', async () => {
      authApi.login.mockRejectedValue(withCode('auth/invalid-credential'));

      await expect(signIn('ana@x.com', 'errada')).resolves.toBeNull();
      expect(accountService.authenticate).not.toHaveBeenCalled();
    });

    it('deve conferir a senha guardada no aparelho quando está offline', async () => {
      authApi.login.mockRejectedValue(new OfflineError());
      accountService.authenticate.mockResolvedValue('ana@x.com');

      await expect(signIn('ana@x.com', 'senha123')).resolves.toBe('ana@x.com');
      expect(accountService.authenticate).toHaveBeenCalledWith(
        'ana@x.com',
        'senha123'
      );
      expect(accountService.rememberAccount).not.toHaveBeenCalled();
    });

    it('deve repassar outros erros do Firebase', async () => {
      authApi.login.mockRejectedValue(withCode('auth/too-many-requests'));

      await expect(signIn('ana@x.com', 'senha123')).rejects.toThrow(
        'Muitas tentativas.'
      );
    });
  });

  it('deve sair da conta no Firebase', async () => {
    await signOut();

    expect(authApi.signOut).toHaveBeenCalled();
  });
});
