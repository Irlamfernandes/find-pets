import * as LocalAuthentication from 'expo-local-authentication';

export const biometricService = {
  // O aparelho tem biometria e ela está cadastrada
  async checkAvailability() {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  },

  // Pede a digital ou o rosto; devolve { success, error }
  async authenticate(promptMessage = 'Autentique-se para entrar no FindPets') {
    return await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Usar senha',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: true,
    });
  },
};
