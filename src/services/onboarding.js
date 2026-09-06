import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = '@FindPets:profile';

export const onboardingService = {
  async saveUserProfile(profileData) {
    if (!profileData.name || !profileData.whatsapp) {
      throw new Error('Dados inválidos para salvamento.');
    }
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profileData));
      return { success: true, data: profileData };
    } catch {
      throw new Error('Erro ao salvar perfil.');
    }
  },

  async getUserProfile() {
    try {
      const data = await AsyncStorage.getItem(PROFILE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
};
