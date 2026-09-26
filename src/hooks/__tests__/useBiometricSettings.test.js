import { renderHook, act } from '@testing-library/react-native';
import {
  useBiometricSettings,
  BIOMETRIC_STATUS,
} from '../useBiometricSettings';
import { biometricService } from '../../services/biometrics';
import { sessionService } from '../../services/session';

jest.mock('../../services/biometrics', () => ({
  biometricService: { checkAvailability: jest.fn(), authenticate: jest.fn() },
}));

jest.mock('../../services/session', () => ({
  sessionService: {
    getSession: jest.fn(),
    getBiometricOwner: jest.fn(),
    getCredentials: jest.fn(),
    verifyPassword: jest.fn(),
    setBiometrics: jest.fn(),
  },
}));

describe('useBiometricSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionService.getSession.mockResolvedValue({ usuario: 'eu@test.com' });
    biometricService.checkAvailability.mockResolvedValue(true);
    sessionService.getBiometricOwner.mockResolvedValue(null);
    sessionService.setBiometrics.mockResolvedValue();
  });

  const renderSettings = async () => {
    const hook = renderHook(() => useBiometricSettings());
    await act(async () => {});
    return hook;
  };

  it('deve identificar cada situação da biometria', async () => {
    expect((await renderSettings()).result.current.status).toBe(
      BIOMETRIC_STATUS.AVAILABLE
    );

    sessionService.getBiometricOwner.mockResolvedValueOnce({
      usuario: 'eu@test.com',
    });
    expect((await renderSettings()).result.current.status).toBe(
      BIOMETRIC_STATUS.ACTIVE
    );

    sessionService.getBiometricOwner.mockResolvedValueOnce({
      usuario: 'outra@test.com',
    });
    const taken = await renderSettings();
    expect(taken.result.current.status).toBe(BIOMETRIC_STATUS.TAKEN);
    expect(taken.result.current.owner).toBe('outra@test.com');

    biometricService.checkAvailability.mockResolvedValueOnce(false);
    expect((await renderSettings()).result.current.status).toBe(
      BIOMETRIC_STATUS.UNAVAILABLE
    );

    sessionService.getSession.mockResolvedValueOnce(null);
    biometricService.checkAvailability.mockResolvedValueOnce(false);
    expect((await renderSettings()).result.current.status).toBe(
      BIOMETRIC_STATUS.UNAVAILABLE
    );

    sessionService.getSession.mockRejectedValueOnce(new Error('x'));
    expect((await renderSettings()).result.current.status).toBe(
      BIOMETRIC_STATUS.UNAVAILABLE
    );
  });

  it('deve verificar a senha da conta logada', async () => {
    const { result } = await renderSettings();
    sessionService.getCredentials.mockResolvedValueOnce({ passwordHash: 'h' });
    sessionService.verifyPassword.mockResolvedValueOnce(true);

    await expect(result.current.verifyPassword('123')).resolves.toBe(true);
    expect(sessionService.getCredentials).toHaveBeenCalledWith('eu@test.com');
    expect(sessionService.verifyPassword).toHaveBeenCalledWith('123', 'h');

    sessionService.getCredentials.mockResolvedValueOnce(null);
    sessionService.verifyPassword.mockResolvedValueOnce(false);
    await expect(result.current.verifyPassword('123')).resolves.toBe(false);
  });

  it('deve ativar após confirmar a biometria e informar cancelamento ou falha', async () => {
    const { result } = await renderSettings();

    biometricService.authenticate.mockResolvedValueOnce({
      success: false,
      error: 'user_cancel',
    });
    await expect(result.current.activate()).resolves.toBe('cancelled');

    biometricService.authenticate.mockResolvedValueOnce({
      success: false,
      error: 'lockout',
    });
    await expect(result.current.activate()).resolves.toBe('failed');
    expect(sessionService.setBiometrics).not.toHaveBeenCalled();

    biometricService.authenticate.mockResolvedValueOnce({ success: true });
    sessionService.getBiometricOwner.mockResolvedValueOnce({
      usuario: 'eu@test.com',
    });
    await act(async () => {
      await expect(result.current.activate()).resolves.toBe('activated');
    });
    expect(sessionService.setBiometrics).toHaveBeenCalledWith(
      'eu@test.com',
      true
    );
    expect(result.current.status).toBe(BIOMETRIC_STATUS.ACTIVE);
  });

  it('deve desativar a biometria da conta', async () => {
    sessionService.getBiometricOwner.mockResolvedValueOnce({
      usuario: 'eu@test.com',
    });
    const { result } = await renderSettings();

    await act(async () => {
      await result.current.deactivate();
    });

    expect(sessionService.setBiometrics).toHaveBeenCalledWith(
      'eu@test.com',
      false
    );
    expect(result.current.status).toBe(BIOMETRIC_STATUS.AVAILABLE);
  });
});
