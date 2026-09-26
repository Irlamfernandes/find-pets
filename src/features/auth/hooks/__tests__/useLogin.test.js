import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useLogin } from '../useLogin';
import { biometricService } from '../../services/biometrics';
import { accountService } from '../../services/accountService';
import { Alert } from 'react-native';

jest.mock('../../services/biometrics');
jest.mock('../../services/accountService');

jest.spyOn(Alert, 'alert');

describe('useLogin Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Padrão: nenhum e-mail cadastrado e nenhuma conta com biometria
    accountService.checkPassword.mockResolvedValue(false);
    accountService.getBiometricOwner.mockResolvedValue(null);
  });

  it('deve inicializar com biometria disponível, mas não autenticar automaticamente', async () => {
    biometricService.checkAvailability.mockResolvedValue(true);
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useLogin(onSuccess));

    await waitFor(() => {
      expect(result.current.hasHardwareBiometric).toBe(true);
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('deve entrar na conta dona da biometria, e não na primeira cadastrada', async () => {
    biometricService.checkAvailability.mockResolvedValue(true);
    biometricService.authenticate.mockResolvedValue({ success: true });
    accountService.getBiometricOwner.mockResolvedValue({
      usuario: 'dona@test.com',
      hasBiometrics: true,
    });
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useLogin(onSuccess));

    await waitFor(() => {
      expect(result.current.biometricOwner).toBe('dona@test.com');
    });

    await act(async () => {
      await result.current.triggerBiometricAuth();
    });

    expect(onSuccess).toHaveBeenCalledWith({
      type: 'biometric',
      usuario: 'dona@test.com',
    });
    expect(accountService.checkPassword).not.toHaveBeenCalled();
  });

  it('deve exibir erro se não houver conta com biometria no aparelho', async () => {
    biometricService.checkAvailability.mockResolvedValue(true);
    const { result } = renderHook(() => useLogin(jest.fn()));

    await act(async () => {
      await result.current.triggerBiometricAuth();
    });

    expect(result.current.errorMessage).toBe(
      'Nenhuma conta com biometria neste aparelho.'
    );
    expect(biometricService.authenticate).not.toHaveBeenCalled();
  });

  it('deve considerar sem dona de biometria se falhar ao verificar ao abrir', async () => {
    biometricService.checkAvailability.mockResolvedValue(true);
    accountService.getBiometricOwner.mockRejectedValueOnce(new Error('x'));
    const { result } = renderHook(() => useLogin(jest.fn()));

    await waitFor(() => {
      expect(result.current.hasHardwareBiometric).toBe(true);
    });
    expect(result.current.biometricOwner).toBeNull();
  });

  it('deve exibir erro se a biometria falhar e ignorar o cancelamento', async () => {
    biometricService.checkAvailability.mockResolvedValue(true);
    accountService.getBiometricOwner.mockResolvedValue({
      usuario: 'dona@test.com',
      hasBiometrics: true,
    });
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useLogin(onSuccess));

    biometricService.authenticate.mockResolvedValueOnce({
      success: false,
      error: 'user_cancel',
    });
    await act(async () => {
      await result.current.triggerBiometricAuth();
    });
    expect(result.current.errorMessage).toBe('');

    biometricService.authenticate.mockResolvedValueOnce({
      success: false,
      error: 'authentication_failed',
    });
    await act(async () => {
      await result.current.triggerBiometricAuth();
    });
    expect(result.current.errorMessage).toBe('Biometria não reconhecida.');

    biometricService.authenticate.mockResolvedValueOnce({ success: false });
    await act(async () => {
      await result.current.triggerBiometricAuth();
    });
    expect(result.current.errorMessage).toBe('');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('deve exibir erro se credenciais manuais forem vazias', async () => {
    biometricService.checkAvailability.mockResolvedValue(false);
    const { result } = renderHook(() => useLogin(jest.fn()));

    await waitFor(() => {
      expect(result.current.hasHardwareBiometric).toBe(false);
    });

    await act(async () => {
      await result.current.handleManualLogin();
    });

    expect(result.current.errorMessage).toBe('Preencha usuário e senha.');
  });

  it('deve exibir erro se o formato do e-mail for inválido no login manual', async () => {
    biometricService.checkAvailability.mockResolvedValue(false);
    const { result } = renderHook(() => useLogin(jest.fn()));

    act(() => {
      result.current.setUsuario('invalid-email');
      result.current.setSenha('123456');
    });

    await act(async () => {
      await result.current.handleManualLogin();
    });

    expect(result.current.errorMessage).toBe(
      'Insira um formato de e-mail válido.'
    );
  });

  it('deve exibir erro se credenciais manuais estiverem incorretas', async () => {
    biometricService.checkAvailability.mockResolvedValue(false);
    accountService.checkPassword.mockResolvedValue(false);

    const { result } = renderHook(() => useLogin(jest.fn()));

    act(() => {
      result.current.setUsuario('correct@test.com');
      result.current.setSenha('wrongpassword');
    });

    await act(async () => {
      await result.current.handleManualLogin();
    });

    expect(result.current.errorMessage).toBe(
      'Usuário não existe ou senha errada.'
    );
  });

  it('deve chamar onSuccess ao fazer login manual válido', async () => {
    biometricService.checkAvailability.mockResolvedValue(false);
    accountService.checkPassword.mockResolvedValue(true);

    const onSuccess = jest.fn();
    const { result } = renderHook(() => useLogin(onSuccess));

    await waitFor(() => {
      expect(result.current.hasHardwareBiometric).toBe(false);
    });

    act(() => {
      result.current.setUsuario('user@test.com');
      result.current.setSenha('123456');
    });

    await act(async () => {
      await result.current.handleManualLogin();
    });

    expect(onSuccess).toHaveBeenCalledWith({
      type: 'credentials',
      usuario: 'user@test.com',
    });
  });

  it('deve exibir erro se tentar cadastrar com campos vazios', async () => {
    const { result } = renderHook(() => useLogin(jest.fn()));

    await act(async () => {
      await result.current.handleRegister();
    });

    expect(result.current.errorMessage).toBe('Preencha usuário e senha.');
  });

  it('deve exibir erro se tentar cadastrar com formato de e-mail inválido', async () => {
    const { result } = renderHook(() => useLogin(jest.fn()));

    act(() => {
      result.current.setUsuario('notanemail');
      result.current.setSenha('123456');
    });

    await act(async () => {
      await result.current.handleRegister();
    });

    expect(result.current.errorMessage).toBe(
      'Insira um formato de e-mail válido.'
    );
  });

  it('deve criar a conta e entrar direto nela, sem voltar para o login', async () => {
    biometricService.checkAvailability.mockResolvedValue(true);
    accountService.createAccount.mockResolvedValue();
    const onSuccess = jest.fn();

    const { result } = renderHook(() => useLogin(onSuccess));

    await waitFor(() => {
      expect(result.current.hasHardwareBiometric).toBe(true);
    });

    act(() => {
      result.current.setUsuario(' novo@test.com ');
      result.current.setSenha('123456');
    });

    await act(async () => {
      await result.current.handleRegister();
    });

    expect(accountService.createAccount).toHaveBeenCalledWith(
      'novo@test.com',
      '123456'
    );
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

  it('deve exibir erro se ocorrer uma exceção ao tentar cadastrar', async () => {
    biometricService.checkAvailability.mockResolvedValue(false);
    accountService.createAccount.mockRejectedValue(new Error('Erro interno'));

    const { result } = renderHook(() => useLogin(jest.fn()));

    act(() => {
      result.current.setUsuario('novo@test.com');
      result.current.setSenha('123456');
    });

    await act(async () => {
      await result.current.handleRegister();
    });

    expect(result.current.errorMessage).toBe('Erro interno');
  });

  it('deve exibir erro genérico se ocorrer uma exceção durante o login manual', async () => {
    biometricService.checkAvailability.mockResolvedValue(false);
    accountService.checkPassword.mockRejectedValue(
      new Error('Erro no banco de dados')
    );

    const { result } = renderHook(() => useLogin(jest.fn()));

    act(() => {
      result.current.setUsuario('user@test.com');
      result.current.setSenha('123456');
    });

    await act(async () => {
      await result.current.handleManualLogin();
    });

    expect(result.current.errorMessage).toBe('Erro no banco de dados');
  });

  it('deve lidar com erros genéricos de cadastro quando o erro não possui mensagem', async () => {
    biometricService.checkAvailability.mockResolvedValue(false);
    accountService.createAccount.mockRejectedValue({});

    const { result } = renderHook(() => useLogin(jest.fn()));

    act(() => {
      result.current.setUsuario('novo@test.com');
      result.current.setSenha('123456');
    });

    await act(async () => {
      await result.current.handleRegister();
    });

    expect(result.current.errorMessage).toBe('Erro ao realizar o cadastro.');
  });

  it('deve exibir erro de usuário incorreto se tentar login manual sem credenciais salvas', async () => {
    biometricService.checkAvailability.mockResolvedValue(false);
    accountService.checkPassword.mockResolvedValue(false);

    const { result } = renderHook(() => useLogin(jest.fn()));

    act(() => {
      result.current.setUsuario('user@test.com');
      result.current.setSenha('123456');
    });

    await act(async () => {
      await result.current.handleManualLogin();
    });

    expect(result.current.errorMessage).toBe(
      'Usuário não existe ou senha errada.'
    );
  });

  it('deve exibir erro se tentar fazer login manual com senha inválida para o usuário salvo', async () => {
    biometricService.checkAvailability.mockResolvedValue(false);
    accountService.checkPassword.mockResolvedValue(false);

    const { result } = renderHook(() => useLogin(jest.fn()));

    act(() => {
      result.current.setUsuario('user@test.com');
      result.current.setSenha('wrongpassword');
    });

    await act(async () => {
      await result.current.handleManualLogin();
    });

    expect(result.current.errorMessage).toBe(
      'Usuário não existe ou senha errada.'
    );
    expect(accountService.checkPassword).toHaveBeenCalledWith(
      'user@test.com',
      'wrongpassword'
    );
  });

  it('deve exibir erro genérico se ocorrer uma exceção ao buscar credenciais no login manual', async () => {
    biometricService.checkAvailability.mockResolvedValue(false);
    accountService.checkPassword.mockRejectedValue(
      new Error('Erro ao ler banco')
    );

    const { result } = renderHook(() => useLogin(jest.fn()));

    act(() => {
      result.current.setUsuario('user@test.com');
      result.current.setSenha('123456');
    });

    await act(async () => {
      await result.current.handleManualLogin();
    });

    expect(result.current.errorMessage).toBe('Erro ao ler banco');
  });

  it('deve lidar com erros genéricos no login manual quando o erro não possui mensagem', async () => {
    biometricService.checkAvailability.mockResolvedValue(false);
    accountService.checkPassword.mockRejectedValue({});

    const { result } = renderHook(() => useLogin(jest.fn()));

    act(() => {
      result.current.setUsuario('user@test.com');
      result.current.setSenha('123456');
    });

    await act(async () => {
      await result.current.handleManualLogin();
    });

    expect(result.current.errorMessage).toBe('Erro ao realizar o login.');
  });

  describe('cadastro de contas', () => {
    const fillForm = (result, email = 'nova@test.com') => {
      act(() => {
        result.current.setUsuario(email);
        result.current.setSenha('123456');
      });
    };

    it('deve impedir cadastrar de novo um e-mail existente', async () => {
      biometricService.checkAvailability.mockResolvedValue(true);
      accountService.createAccount.mockRejectedValue(
        new Error('Este e-mail já está cadastrado. Faça login.')
      );
      const { result } = renderHook(() => useLogin(jest.fn()));
      fillForm(result);

      await act(async () => {
        await result.current.handleRegister();
      });

      expect(result.current.errorMessage).toBe(
        'Este e-mail já está cadastrado. Faça login.'
      );
      expect(biometricService.authenticate).not.toHaveBeenCalled();
    });
  });
});
