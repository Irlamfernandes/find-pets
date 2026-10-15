import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useLogin } from '../useLogin';
import { biometricService } from '../../services/biometrics';
import { accountService } from '../../services/accountService';
import { signIn, signUp } from '../../services/signInService';
import { Alert } from 'react-native';

jest.mock('../../services/biometrics');
jest.mock('../../services/accountService');
jest.mock('../../services/signInService');

jest.spyOn(Alert, 'alert');

const OWNER = { usuario: 'dona@test.com', hasBiometrics: true };

const renderLogin = (onSuccess = jest.fn()) =>
  renderHook(() => useLogin(onSuccess)).result;

// Preenche o formulário e aperta o botão (`handleManualLogin` ou `handleRegister`)
const submit = async (result, action, { usuario = '', senha = '' } = {}) => {
  act(() => {
    result.current.setUsuario(usuario);
    result.current.setSenha(senha);
  });
  await act(async () => {
    await result.current[action]();
  });
};

const triggerBiometric = async (result) => {
  await act(async () => {
    await result.current.triggerBiometricAuth();
  });
};

describe('useLogin Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Padrão: nenhum e-mail cadastrado e nenhuma conta com biometria
    biometricService.checkAvailability.mockResolvedValue(false);
    signIn.mockResolvedValue(null);
    accountService.getBiometricOwner.mockResolvedValue(null);
  });

  describe('biometria', () => {
    beforeEach(() => {
      biometricService.checkAvailability.mockResolvedValue(true);
    });

    it('deve inicializar com biometria disponível, mas não autenticar automaticamente', async () => {
      const onSuccess = jest.fn();
      const result = renderLogin(onSuccess);

      await waitFor(() => {
        expect(result.current.hasHardwareBiometric).toBe(true);
      });

      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('deve entrar na conta dona da biometria, e não na primeira cadastrada', async () => {
      biometricService.authenticate.mockResolvedValue({ success: true });
      accountService.getBiometricOwner.mockResolvedValue(OWNER);
      const onSuccess = jest.fn();
      const result = renderLogin(onSuccess);

      await waitFor(() => {
        expect(result.current.biometricOwner).toBe('dona@test.com');
      });
      await triggerBiometric(result);

      expect(onSuccess).toHaveBeenCalledWith({
        type: 'biometric',
        usuario: 'dona@test.com',
      });
      expect(signIn).not.toHaveBeenCalled();
    });

    it('deve exibir erro se não houver conta com biometria no aparelho', async () => {
      const result = renderLogin();

      await triggerBiometric(result);

      expect(result.current.errorMessage).toBe(
        'Nenhuma conta com biometria neste aparelho.'
      );
      expect(biometricService.authenticate).not.toHaveBeenCalled();
    });

    it('deve considerar sem dona de biometria se falhar ao verificar ao abrir', async () => {
      accountService.getBiometricOwner.mockRejectedValueOnce(new Error('x'));
      const result = renderLogin();

      await waitFor(() => {
        expect(result.current.hasHardwareBiometric).toBe(true);
      });
      expect(result.current.biometricOwner).toBeNull();
    });

    it.each([
      ['ignorar o cancelamento', { success: false, error: 'user_cancel' }, ''],
      [
        'avisar a falha',
        { success: false, error: 'authentication_failed' },
        'Biometria não reconhecida.',
      ],
      ['ignorar falha sem motivo', { success: false }, ''],
    ])('deve %s da biometria', async (_case, response, message) => {
      accountService.getBiometricOwner.mockResolvedValue(OWNER);
      biometricService.authenticate.mockResolvedValueOnce(response);
      const onSuccess = jest.fn();
      const result = renderLogin(onSuccess);

      await waitFor(() => {
        expect(result.current.biometricOwner).toBe('dona@test.com');
      });
      await triggerBiometric(result);

      expect(result.current.errorMessage).toBe(message);
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe.each([
    ['login manual', 'handleManualLogin'],
    ['cadastro', 'handleRegister'],
  ])('validação do %s', (_name, action) => {
    it('deve exigir usuário e senha', async () => {
      const result = renderLogin();

      await submit(result, action);

      expect(result.current.errorMessage).toBe('Preencha usuário e senha.');
    });

    it('deve exigir um e-mail válido', async () => {
      const result = renderLogin();

      await submit(result, action, { usuario: 'notanemail', senha: '123456' });

      expect(result.current.errorMessage).toBe(
        'Insira um formato de e-mail válido.'
      );
    });
  });

  describe('login manual', () => {
    const CREDENTIALS = { usuario: 'user@test.com', senha: '123456' };

    it('deve exibir erro se credenciais manuais estiverem incorretas', async () => {
      const result = renderLogin();

      await submit(result, 'handleManualLogin', {
        usuario: 'user@test.com',
        senha: 'wrongpassword',
      });

      expect(result.current.errorMessage).toBe(
        'Usuário não existe ou senha errada.'
      );
      expect(signIn).toHaveBeenCalledWith('user@test.com', 'wrongpassword');
    });

    it('deve chamar onSuccess ao fazer login manual válido', async () => {
      signIn.mockResolvedValue('user@test.com');
      const onSuccess = jest.fn();
      const result = renderLogin(onSuccess);

      await submit(result, 'handleManualLogin', CREDENTIALS);

      expect(onSuccess).toHaveBeenCalledWith({
        type: 'credentials',
        usuario: 'user@test.com',
      });
    });

    it('deve entrar na conta como foi cadastrada, mesmo com outras maiúsculas', async () => {
      signIn.mockResolvedValue('Ana@Test.com');
      const onSuccess = jest.fn();
      const result = renderLogin(onSuccess);

      await submit(result, 'handleManualLogin', {
        usuario: ' ANA@test.com ',
        senha: '123456',
      });

      expect(signIn).toHaveBeenCalledWith('ANA@test.com', '123456');
      expect(onSuccess).toHaveBeenCalledWith({
        type: 'credentials',
        usuario: 'Ana@Test.com',
      });
    });

    it.each([
      [new Error('Erro no banco de dados'), 'Erro no banco de dados'],
      [{}, 'Erro ao realizar o login.'],
    ])('deve exibir o erro da falha %#', async (error, message) => {
      signIn.mockRejectedValue(error);
      const result = renderLogin();

      await submit(result, 'handleManualLogin', CREDENTIALS);

      expect(result.current.errorMessage).toBe(message);
    });
  });

  describe('cadastro', () => {
    const NEW_ACCOUNT = { usuario: 'novo@test.com', senha: '123456' };

    it('deve criar a conta e entrar direto nela, sem voltar para o login', async () => {
      biometricService.checkAvailability.mockResolvedValue(true);
      signUp.mockResolvedValue('novo@test.com');
      const onSuccess = jest.fn();
      const result = renderLogin(onSuccess);

      await waitFor(() => {
        expect(result.current.hasHardwareBiometric).toBe(true);
      });
      await submit(result, 'handleRegister', {
        ...NEW_ACCOUNT,
        usuario: ' novo@test.com ',
      });

      expect(signUp).toHaveBeenCalledWith('novo@test.com', '123456');
      // O cadastro não pede biometria (ela é oferecida no fim do cadastro)
      expect(biometricService.authenticate).not.toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalledWith({
        type: 'register',
        usuario: 'novo@test.com',
      });
      expect(result.current.errorMessage).toBe('');
      expect(result.current.usuario).toBe('');
      expect(result.current.senha).toBe('');
    });

    it('deve abrir a sessão com o e-mail devolvido pelo servidor', async () => {
      signUp.mockResolvedValue('novo@test.com');
      const onSuccess = jest.fn();
      const result = renderLogin(onSuccess);

      await submit(result, 'handleRegister', {
        ...NEW_ACCOUNT,
        usuario: 'Novo@Test.COM',
      });

      expect(onSuccess).toHaveBeenCalledWith({
        type: 'register',
        usuario: 'novo@test.com',
      });
    });

    it.each([
      [
        new Error('Este e-mail já está cadastrado. Faça login.'),
        'Este e-mail já está cadastrado. Faça login.',
      ],
      [new Error('Erro interno'), 'Erro interno'],
      [{}, 'Erro ao realizar o cadastro.'],
    ])('deve exibir o erro da falha %#', async (error, message) => {
      signUp.mockRejectedValue(error);
      const result = renderLogin();

      await submit(result, 'handleRegister', NEW_ACCOUNT);

      expect(result.current.errorMessage).toBe(message);
      expect(biometricService.authenticate).not.toHaveBeenCalled();
    });
  });
});
