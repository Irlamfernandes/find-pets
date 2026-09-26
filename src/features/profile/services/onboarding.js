import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../../shared/constants/storageKeys';
import { sessionService } from '../../auth/services/session';

export const onboardingService = {
  async saveUserProfile(profileData, usuario) {
    if (!profileData?.name || !profileData?.whatsapp) {
      throw new Error('Dados inválidos para salvamento do perfil.');
    }
    try {
      const activeSession = usuario ? null : await sessionService.getSession();
      const profileUser = usuario || activeSession?.usuario;
      const savedData = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
      const savedProfiles = savedData ? JSON.parse(savedData) : null;

      if (profileUser) {
        let profiles = {};
        if (savedProfiles && !Array.isArray(savedProfiles)) {
          if (savedProfiles.name) {
            profiles = { [profileUser]: savedProfiles };
          } else {
            profiles = savedProfiles;
          }
        }

        profiles[profileUser] = profileData;
        await AsyncStorage.setItem(
          STORAGE_KEYS.PROFILE,
          JSON.stringify(profiles)
        );
      } else {
        await AsyncStorage.setItem(
          STORAGE_KEYS.PROFILE,
          JSON.stringify(profileData)
        );
      }
      return { success: true, data: profileData };
    } catch (error) {
      throw new Error(`Erro ao salvar perfil: ${error.message}`);
    }
  },

  async getUserProfile(usuario) {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
      if (!data) return null;

      const savedProfiles = JSON.parse(data);
      const activeSession = usuario ? null : await sessionService.getSession();
      const profileUser = usuario || activeSession?.usuario;

      if (profileUser && !savedProfiles.name) {
        return savedProfiles[profileUser] || null;
      }

      return savedProfiles;
    } catch (error) {
      throw new Error(`Erro ao buscar perfil: ${error.message}`);
    }
  },
};
