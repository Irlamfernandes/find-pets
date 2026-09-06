import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@FindPets:session';
const CREDENTIALS_KEY = '@FindPets:credentials';

export const sessionService = {
  // Salva os dados de cadastro (email, senha e se tem biometria)
  async saveCredentials(email, password, hasBiometrics = false) {
    try {
      const data = { email, password, hasBiometrics };
      await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify(data));
    } catch {
      throw new Error('Erro ao salvar credenciais.');
    }
  },

  async getCredentials() {
    try {
      const data = await AsyncStorage.getItem(CREDENTIALS_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async saveSession(userData) {
    try {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(userData));
    } catch {
      throw new Error('Erro ao salvar a sessão.');
    }
  },

  async getSession() {
    try {
      const data = await AsyncStorage.getItem(SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async clearSession() {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
    } catch {
      throw new Error('Erro ao encerrar a sessão.');
    }
  },
};
