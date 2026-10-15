import { signIn, signUp } from '../signInService';
import { authApi } from '../authApi';
import { accountService } from '../accountService';
import { tokenStorage } from '../tokenStorage';
import { HttpError, OfflineError } from '../../../../shared/api/httpClient';

jest.mock('../authApi');
jest.mock('../accountService');
jest.mock('../tokenStorage');

const SESSION = { token: 'token-ana', email: 'ana@x.com' };

describe('signInService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('signUp', () => {
    it('deve criar a conta no servidor e guardá-la no aparelho', async () => {
      authApi.register.mockResolvedValue(SESSION);

      await expect(signUp('Ana@x.com', 'senha')).resolves.toBe('ana@x.com');

      expect(authApi.register).toHaveBeenCalledWith('Ana@x.com', 'senha');
      expect(accountService.rememberAccount).toHaveBeenCalledWith(
        'ana@x.com',
        'senha'
      );
      expect(tokenStorage.save).toHaveBeenCalledWith('ana@x.com', 'token-ana');
    });

    it('deve exigir internet para criar a conta', async () => {
      authApi.register.mockRejectedValue(new OfflineError());

      await expect(signUp('ana@x.com', 'senha')).rejects.toThrow(
        'Conecte-se à internet para criar a conta.'
      );
      expect(accountService.rememberAccount).not.toHaveBeenCalled();
    });

    it('deve repassar a recusa do servidor (ex.: e-mail já cadastrado)', async () => {
      authApi.register.mockRejectedValue(
        new HttpError(409, 'Este e-mail já está cadastrado.')
      );

      await expect(signUp('ana@x.com', 'senha')).rejects.toThrow(
        'Este e-mail já está cadastrado.'
      );
    });
  });

  describe('signIn', () => {
    it('deve entrar pelo servidor e guardar a conta no aparelho', async () => {
      authApi.login.mockResolvedValue(SESSION);

      await expect(signIn('ana@x.com', 'senha')).resolves.toBe('ana@x.com');

      expect(accountService.rememberAccount).toHaveBeenCalledWith(
        'ana@x.com',
        'senha'
      );
      expect(tokenStorage.save).toHaveBeenCalledWith('ana@x.com', 'token-ana');
      expect(accountService.authenticate).not.toHaveBeenCalled();
    });

    it('deve devolver null quando o servidor recusa a senha', async () => {
      authApi.login.mockRejectedValue(new HttpError(401, 'Senha errada.'));

      await expect(signIn('ana@x.com', 'errada')).resolves.toBeNull();
      expect(accountService.authenticate).not.toHaveBeenCalled();
    });

    it('deve conferir a senha guardada no aparelho quando está offline', async () => {
      authApi.login.mockRejectedValue(new OfflineError());
      accountService.authenticate.mockResolvedValue('ana@x.com');

      await expect(signIn('ana@x.com', 'senha')).resolves.toBe('ana@x.com');
      expect(accountService.authenticate).toHaveBeenCalledWith(
        'ana@x.com',
        'senha'
      );
      expect(tokenStorage.save).not.toHaveBeenCalled();
    });

    it('deve repassar outros erros do servidor', async () => {
      authApi.login.mockRejectedValue(new HttpError(500, 'Falha interna.'));

      await expect(signIn('ana@x.com', 'senha')).rejects.toThrow(
        'Falha interna.'
      );
    });
  });
});
