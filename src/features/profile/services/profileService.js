import { withErrorContext } from '../../../shared/services/storage';
import { sessionService } from '../../auth/services/sessionService';
import { profileRepository } from '../data/profileRepository';
import { requestSync } from '../../../shared/services/syncScheduler';

// Perfil da conta conectada
export const profileService = {
  async saveProfile(profile) {
    if (!profile?.name || !profile?.whatsapp) {
      throw new Error('Dados inválidos para salvamento do perfil.');
    }
    return withErrorContext('Erro ao salvar perfil', async () => {
      const owner = await sessionService.getCurrentUser();
      if (!owner) throw new Error('Nenhuma conta conectada.');
      await profileRepository.save(owner, profile);
      requestSync();
      return profile;
    });
  },

  getProfile() {
    return withErrorContext('Erro ao buscar perfil', async () => {
      const owner = await sessionService.getCurrentUser();
      return owner ? profileRepository.findByUser(owner) : null;
    });
  },
};
