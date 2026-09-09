import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storageKeys';

export const onboardingService = {
  async saveUserProfile(profileData) {
    if (!profileData || !profileData.name || !profileData.whatsapp) {
      throw new Error('Dados inválidos para salvamento do perfil.');
    }
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.PROFILE,
        JSON.stringify(profileData)
      );
      return { success: true, data: profileData };
    } catch (error) {
      throw new Error(`Erro ao salvar perfil: ${error.message}`);
    }
  },

  async getUserProfile() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      throw new Error(`Erro ao buscar perfil: ${error.message}`);
    }
  },
};
