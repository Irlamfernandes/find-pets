import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useLogin } from '../useLogin';
import { biometricService } from '../../services/biometrics';

jest.mock('../../services/biometrics');

describe('useLogin Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve inicializar com biometria desativada e tentar autenticar se disponível', async () => {
    biometricService.checkAvailability.mockResolvedValue(true);
    biometricService.authenticate.mockResolvedValue({ success: true });

    const onSuccess = jest.fn();
    const { result } = renderHook(() => useLogin(onSuccess));

    await waitFor(() => {
      expect(result.current.hasBiometrics).toBe(true);
    });

    expect(onSuccess).toHaveBeenCalledWith({ type: 'biometric' });
  });

  it('deve exibir erro se a biometria falhar', async () => {
    biometricService.checkAvailability.mockResolvedValue(true);
    biometricService.authenticate.mockResolvedValue({
      success: false,
      error: 'system_cancel',
    });

    const { result } = renderHook(() => useLogin(jest.fn()));

    await waitFor(() => {
      expect(result.current.errorMessage).toBe(
        'Falha na autenticação biométrica.'
      );
    });
  });

  it('deve exibir erro se credenciais manuais forem vazias', async () => {
    biometricService.checkAvailability.mockResolvedValue(false);
    const { result } = renderHook(() => useLogin(jest.fn()));

    await waitFor(() => {
      expect(result.current.hasBiometrics).toBe(false);
    });

    act(() => {
      result.current.handleManualLogin();
    });

    expect(result.current.errorMessage).toBe('Preencha e-mail e senha.');
  });

  it('deve chamar onSuccess ao fazer login manual válido', async () => {
    biometricService.checkAvailability.mockResolvedValue(false);
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useLogin(onSuccess));

    await waitFor(() => {
      expect(result.current.hasBiometrics).toBe(false);
    });

    act(() => {
      result.current.setEmail('user@test.com');
      result.current.setPassword('123456');
    });

    act(() => {
      result.current.handleManualLogin();
    });

    expect(onSuccess).toHaveBeenCalledWith({
      type: 'credentials',
      email: 'user@test.com',
    });
  });

  it('nao deve definir mensagem de erro se o usuario cancelar a biometria', async () => {
    biometricService.checkAvailability.mockResolvedValue(true);
    biometricService.authenticate.mockResolvedValue({
      success: false,
      error: 'user_cancel',
    });

    const { result } = renderHook(() => useLogin(jest.fn()));

    await waitFor(() => {
      expect(result.current.hasBiometrics).toBe(true);
    });

    expect(result.current.errorMessage).toBe('');
  });
});
