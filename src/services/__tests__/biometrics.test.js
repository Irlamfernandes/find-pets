import { biometricService } from '../biometrics';
import * as LocalAuthentication from 'expo-local-authentication';

jest.mock('expo-local-authentication');

describe('biometricService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar true em checkAvailability se houver hardware e estiver cadastrado', async () => {
    LocalAuthentication.hasHardwareAsync.mockResolvedValue(true);
    LocalAuthentication.isEnrolledAsync.mockResolvedValue(true);

    const result = await biometricService.checkAvailability();
    expect(result).toBe(true);
  });

  it('deve retornar false se o dispositivo não possuir hardware', async () => {
    LocalAuthentication.hasHardwareAsync.mockResolvedValue(false);
    LocalAuthentication.isEnrolledAsync.mockResolvedValue(true);

    const result = await biometricService.checkAvailability();
    expect(result).toBe(false);
  });

  it('deve chamar authenticateAsync com a mensagem padrão se nenhuma for enviada', async () => {
    LocalAuthentication.authenticateAsync.mockResolvedValue({ success: true });

    const result = await biometricService.authenticate();

    expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledWith({
      promptMessage: 'Autentique-se para entrar no Find Pets',
      fallbackLabel: 'Usar senha',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: true,
    });
    expect(result).toEqual({ success: true });
  });

  it('deve chamar authenticateAsync com mensagem customizada', async () => {
    LocalAuthentication.authenticateAsync.mockResolvedValue({ success: true });

    await biometricService.authenticate('Mensagem Customizada');

    expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledWith({
      promptMessage: 'Mensagem Customizada',
      fallbackLabel: 'Usar senha',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: true,
    });
  });
});
