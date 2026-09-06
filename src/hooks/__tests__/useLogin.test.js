import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useLogin } from '../useLogin';
import { biometricService } from '../../services/biometrics';
import { sessionService } from '../../services/session';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../../services/biometrics');
jest.mock('../../services/session');

// MOCK DO ALERT GLOBAL (Pois o hook usa alert() nativo do JS)
global.alert = jest.fn();

describe('useLogin Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('deve disparar autenticação biométrica com sucesso ao chamar triggerBiometricAuth', async () => {
    biometricService.checkAvailability.mockResolvedValue(true);
    biometricService.authenticate.mockResolvedValue({ success: true });
    sessionService.getCredentials.mockResolvedValue({
      email: 'user@test.com',
      hasBiometrics: true,
    });

    const onSuccess = jest.fn();
    const { result } = renderHook(() => useLogin(onSuccess));

    await waitFor(() => {
      expect(result.current.hasHardwareBiometric).toBe(true);
    });

    await act(async () => {
      await result.current.triggerBiometricAuth();
    });

    expect(onSuccess).toHaveBeenCalledWith({
      type: 'biometric',
      usuario: 'user@test.com',
    });
  });

  it('deve exibir erro se tentar biometria e não houver usuário cadastrado', async () => {
    biometricService.checkAvailability.mockResolvedValue(true);
    sessionService.getCredentials.mockResolvedValue(null);

    const { result } = renderHook(() => useLogin(jest.fn()));

    await act(async () => {
      await result.current.triggerBiometricAuth();
    });

    expect(result.current.errorMessage).toBe(
      'Nenhum usuário cadastrado neste dispositivo.'
    );
  });

  it('deve exibir erro se a biometria não estiver habilitada para o usuário', async () => {
    biometricService.checkAvailability.mockResolvedValue(true);
    sessionService.getCredentials.mockResolvedValue({
      email: 'user@test.com',
      hasBiometrics: false,
    });

    const { result } = renderHook(() => useLogin(jest.fn()));

    await act(async () => {
      await result.current.triggerBiometricAuth();
    });

    expect(result.current.errorMessage).toBe(
      'A biometria não foi cadastrada para este usuário.'
    );
  });

  it('deve exibir erro se a biometria falhar', async () => {
    biometricService.checkAvailability.mockResolvedValue(true);
    biometricService.authenticate.mockResolvedValue({
      success: false,
      error: 'system_cancel',
    });
    sessionService.getCredentials.mockResolvedValue({
      email: 'user@test.com',
      hasBiometrics: true,
    });

    const { result } = renderHook(() => useLogin(jest.fn()));

    await waitFor(() => {
      expect(result.current.hasHardwareBiometric).toBe(true);
    });

    await act(async () => {
      await result.current.triggerBiometricAuth();
    });

    expect(result.current.errorMessage).toBe('Biometria não reconhecida.');
  });

  it('nao deve definir mensagem de erro se o usuario cancelar a biometria', async () => {
    biometricService.checkAvailability.mockResolvedValue(true);
    biometricService.authenticate.mockResolvedValue({
      success: false,
      error: 'user_cancel',
    });
    sessionService.getCredentials.mockResolvedValue({
      email: 'user@test.com',
      hasBiometrics: true,
    });

    const { result } = renderHook(() => useLogin(jest.fn()));

    await waitFor(() => {
      expect(result.current.hasHardwareBiometric).toBe(true);
    });

    await act(async () => {
      await result.current.triggerBiometricAuth();
    });

    expect(result.current.errorMessage).toBe('');
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

  it('deve exibir erro se credenciais manuais estiverem incorretas', async () => {
    biometricService.checkAvailability.mockResolvedValue(false);
    sessionService.getCredentials.mockResolvedValue({
      email: 'correct@test.com',
      password: '123',
    });

    const { result } = renderHook(() => useLogin(jest.fn()));

    act(() => {
      result.current.setUsuario('wrong@test.com');
      result.current.setSenha('wrong');
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
    sessionService.getCredentials.mockResolvedValue({
      email: 'user@test.com',
      password: '123456',
    });

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

  it('deve realizar o cadastro com sucesso ao chamar handleRegister', async () => {
    biometricService.checkAvailability.mockResolvedValue(true);
    biometricService.authenticate.mockResolvedValue({ success: true });
    sessionService.saveCredentials.mockResolvedValue(true);

    const { result } = renderHook(() => useLogin(jest.fn()));

    await waitFor(() => {
      expect(result.current.hasHardwareBiometric).toBe(true);
    });

    act(() => {
      result.current.setUsuario('novo@test.com');
      result.current.setSenha('123456');
    });

    await act(async () => {
      await result.current.handleRegister();
    });

    expect(global.alert).toHaveBeenCalledWith(
      'Cadastro realizado com sucesso! Faça o login.'
    );
    expect(result.current.errorMessage).toBe('');
    expect(result.current.authMode).toBe('home');
  });

  it('deve exibir erro se ocorrer uma exceção ao tentar cadastrar', async () => {
    biometricService.checkAvailability.mockResolvedValue(false);
    sessionService.saveCredentials.mockRejectedValue(new Error('Erro interno'));

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

  it('deve realizar o cadastro com sucesso mesmo se a biometria falhar ou for recusada', async () => {
    biometricService.checkAvailability.mockResolvedValue(true);
    // Simula que a biometria falhou ou foi cancelada no cadastro
    biometricService.authenticate.mockResolvedValue({ success: false });
    sessionService.saveCredentials.mockResolvedValue(true);

    const { result } = renderHook(() => useLogin(jest.fn()));

    await waitFor(() => {
      expect(result.current.hasHardwareBiometric).toBe(true);
    });

    act(() => {
      result.current.setUsuario('novo@test.com');
      result.current.setSenha('123456');
    });

    await act(async () => {
      await result.current.handleRegister();
    });

    // Garante que salvou com hasBiometrics = false, mas o cadastro passou
    expect(sessionService.saveCredentials).toHaveBeenCalledWith(
      'novo@test.com',
      '123456',
      false
    );
    expect(result.current.authMode).toBe('home');
    expect(result.current.errorMessage).toBe('');
  });
});
