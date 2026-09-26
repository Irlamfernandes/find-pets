import { renderHook, act } from '@testing-library/react-native';
import { useUnlock } from '../useUnlock';
import { biometricService } from '../../services/biometrics';
import { sessionService } from '../../services/session';

jest.mock('../../services/biometrics', () => ({
  biometricService: { checkAvailability: jest.fn(), authenticate: jest.fn() },
}));

jest.mock('../../services/session', () => ({
  sessionService: {
    getBiometricOwner: jest.fn(),
    getCredentials: jest.fn(),
    verifyPassword: jest.fn(),
  },
}));

describe('useUnlock', () => {
  const onUnlocked = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    biometricService.checkAvailability.mockResolvedValue(true);
    sessionService.getBiometricOwner.mockResolvedValue({
      usuario: 'dono@test.com',
      hasBiometrics: true,
    });
  });

  const renderUnlock = async (usuario = 'dono@test.com') => {
    const hook = renderHook(() => useUnlock(usuario, onUnlocked));
    await act(async () => {});
    return hook;
  };

  it('deve pedir a biometria ao abrir para o dono e desbloquear', async () => {
    biometricService.authenticate.mockResolvedValueOnce({ success: true });
    const { result } = await renderUnlock();

    expect(result.current.canUseBiometrics).toBe(true);
    expect(biometricService.authenticate).toHaveBeenCalledWith(
      'Confirme sua identidade para entrar'
    );
    expect(onUnlocked).toHaveBeenCalledTimes(1);
  });

  it('deve manter a tela ao cancelar e avisar quando a biometria falhar', async () => {
    biometricService.authenticate.mockResolvedValueOnce({
      success: false,
      error: 'user_cancel',
    });
    const { result } = await renderUnlock();
    expect(result.current.errorMessage).toBe('');

    biometricService.authenticate.mockResolvedValueOnce({
      success: false,
      error: 'lockout',
    });
    await act(async () => {
      await result.current.unlockWithBiometrics();
    });
    expect(result.current.errorMessage).toBe(
      'Biometria não reconhecida. Use sua senha.'
    );

    biometricService.authenticate.mockResolvedValueOnce({ success: false });
    await act(async () => {
      await result.current.unlockWithBiometrics();
    });
    expect(result.current.errorMessage).toBe('');
    expect(onUnlocked).not.toHaveBeenCalled();
  });

  it('não deve oferecer biometria para outra conta, sem leitor ou com erro', async () => {
    const other = await renderUnlock('outra@test.com');
    expect(other.result.current.canUseBiometrics).toBe(false);

    biometricService.checkAvailability.mockResolvedValueOnce(false);
    const noHardware = await renderUnlock();
    expect(noHardware.result.current.canUseBiometrics).toBe(false);

    sessionService.getBiometricOwner.mockResolvedValueOnce(null);
    const noOwner = await renderUnlock();
    expect(noOwner.result.current.canUseBiometrics).toBe(false);

    sessionService.getBiometricOwner.mockRejectedValueOnce(new Error('x'));
    const failing = await renderUnlock();
    expect(failing.result.current.canUseBiometrics).toBe(false);

    expect(biometricService.authenticate).not.toHaveBeenCalled();
  });

  it('não deve pedir biometria se a tela fechar antes de verificar', async () => {
    let finish;
    sessionService.getBiometricOwner.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    const { unmount } = renderHook(() =>
      useUnlock('dono@test.com', onUnlocked)
    );
    unmount();

    await act(async () => {
      finish({ usuario: 'dono@test.com' });
    });
    expect(biometricService.authenticate).not.toHaveBeenCalled();
  });

  it('deve desbloquear com a senha correta e validar os erros', async () => {
    const { result } = await renderUnlock('outra@test.com');

    await act(async () => {
      await result.current.unlockWithPassword();
    });
    expect(result.current.errorMessage).toBe('Digite sua senha.');

    act(() => result.current.setPassword('errada'));
    sessionService.getCredentials.mockResolvedValueOnce({ passwordHash: 'h' });
    sessionService.verifyPassword.mockResolvedValueOnce(false);
    await act(async () => {
      await result.current.unlockWithPassword();
    });
    expect(result.current.errorMessage).toBe('Senha incorreta.');

    sessionService.getCredentials.mockRejectedValueOnce(new Error('x'));
    await act(async () => {
      await result.current.unlockWithPassword();
    });
    expect(result.current.errorMessage).toBe(
      'Não foi possível verificar a senha agora.'
    );

    act(() => result.current.setPassword('certa'));
    sessionService.getCredentials.mockResolvedValueOnce(null);
    sessionService.verifyPassword.mockResolvedValueOnce(true);
    await act(async () => {
      await result.current.unlockWithPassword();
    });
    expect(sessionService.getCredentials).toHaveBeenCalledWith(
      'outra@test.com'
    );
    expect(sessionService.verifyPassword).toHaveBeenLastCalledWith(
      'certa',
      undefined
    );
    expect(onUnlocked).toHaveBeenCalledTimes(1);
  });
});
