import { STORAGE_KEYS } from '../../../shared/constants/storageKeys';
import {
  createJsonStore,
  withErrorContext,
} from '../../../shared/services/storage';
import { sessionService } from '../../auth/services/sessionService';

// Perfis por conta: { [usuario]: { name, whatsapp, photoUri } }
const profilesStore = createJsonStore(STORAGE_KEYS.PROFILE, { fallback: {} });

// Sem usuário informado, usa a conta conectada
async function resolveOwner(usuario) {
  return usuario || sessionService.getCurrentUser();
}

export const profileService = {
  async saveProfile(profile, usuario) {
    if (!profile?.name || !profile?.whatsapp) {
      throw new Error('Dados inválidos para salvamento do perfil.');
    }
    return withErrorContext('Erro ao salvar perfil', async () => {
      const owner = await resolveOwner(usuario);
      if (!owner) throw new Error('Nenhuma conta conectada.');
      await profilesStore.update((profiles) => ({
        ...profiles,
        [owner]: profile,
      }));
      return profile;
    });
  },

  getProfile(usuario) {
    return withErrorContext('Erro ao buscar perfil', async () => {
      const owner = await resolveOwner(usuario);
      if (!owner) return null;
      const profiles = await profilesStore.read();
      return profiles[owner] || null;
    });
  },
};
