import * as LocalAuthentication from 'expo-local-authentication';

export const biometricService = {
  async checkAvailability() {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  },

  async authenticate(promptMessage = 'Autentique-se para entrar no Find Pets') {
    return await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Usar senha',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: true,
    });
  },
};
