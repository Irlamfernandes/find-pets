import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@FindPets:session';
const PROFILE_KEY = '@FindPets:profile';

export const sessionService = {
  async saveSession(userData) {
    try {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(userData));
    } catch (error) {
      throw new Error('Erro ao salvar a sessão.');
    }
  },

  async getSession() {
    try {
      const data = await AsyncStorage.getItem(SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  },

  async clearSession() {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
      await AsyncStorage.removeItem(PROFILE_KEY);
    } catch (error) {
      throw new Error('Erro ao encerrar a sessão.');
    }
  },
};
