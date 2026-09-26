import { renderHook, act } from '@testing-library/react-native';
import {
  useBiometricSettings,
  BIOMETRIC_STATUS,
} from '../useBiometricSettings';
import { biometricService } from '../../services/biometrics';
import { accountService } from '../../services/accountService';
import { sessionService } from '../../services/sessionService';

jest.mock('../../services/biometrics', () => ({
  biometricService: { checkAvailability: jest.fn(), authenticate: jest.fn() },
}));

jest.mock('../../services/accountService');
jest.mock('../../services/sessionService');

describe('useBiometricSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionService.getCurrentUser.mockResolvedValue('eu@test.com');
    biometricService.checkAvailability.mockResolvedValue(true);
    accountService.getBiometricOwner.mockResolvedValue(null);
    accountService.setBiometrics.mockResolvedValue();
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

    accountService.getBiometricOwner.mockResolvedValueOnce({
      usuario: 'eu@test.com',
    });
    expect((await renderSettings()).result.current.status).toBe(
      BIOMETRIC_STATUS.ACTIVE
    );

    accountService.getBiometricOwner.mockResolvedValueOnce({
      usuario: 'outra@test.com',
    });
    const taken = await renderSettings();
    expect(taken.result.current.status).toBe(BIOMETRIC_STATUS.TAKEN);
    expect(taken.result.current.owner).toBe('outra@test.com');

    biometricService.checkAvailability.mockResolvedValueOnce(false);
    expect((await renderSettings()).result.current.status).toBe(
      BIOMETRIC_STATUS.UNAVAILABLE
    );

    sessionService.getCurrentUser.mockResolvedValueOnce(null);
    biometricService.checkAvailability.mockResolvedValueOnce(false);
    expect((await renderSettings()).result.current.status).toBe(
      BIOMETRIC_STATUS.UNAVAILABLE
    );

    sessionService.getCurrentUser.mockRejectedValueOnce(new Error('x'));
    expect((await renderSettings()).result.current.status).toBe(
      BIOMETRIC_STATUS.UNAVAILABLE
    );
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
    expect(accountService.setBiometrics).not.toHaveBeenCalled();

    biometricService.authenticate.mockResolvedValueOnce({ success: true });
    accountService.getBiometricOwner.mockResolvedValueOnce({
      usuario: 'eu@test.com',
    });
    await act(async () => {
      await expect(result.current.activate()).resolves.toBe('activated');
    });
    expect(accountService.setBiometrics).toHaveBeenCalledWith(
      'eu@test.com',
      true
    );
    expect(result.current.status).toBe(BIOMETRIC_STATUS.ACTIVE);
  });

  it('deve desativar a biometria da conta', async () => {
    accountService.getBiometricOwner.mockResolvedValueOnce({
      usuario: 'eu@test.com',
    });
    const { result } = await renderSettings();

    await act(async () => {
      await result.current.deactivate();
    });

    expect(accountService.setBiometrics).toHaveBeenCalledWith(
      'eu@test.com',
      false
    );
    expect(result.current.status).toBe(BIOMETRIC_STATUS.AVAILABLE);
  });
});
