import { STORAGE_KEYS } from '../../../shared/constants/storageKeys';
import {
  createJsonStore,
  withErrorContext,
} from '../../../shared/services/storage';

// Sessão da conta conectada neste aparelho
const sessionStore = createJsonStore(STORAGE_KEYS.SESSION);

export const sessionService = {
  async saveSession(userData) {
    if (!userData) {
      throw new Error('Dados de sessão inválidos.');
    }
    return withErrorContext('Erro ao persistir sessão', () =>
      sessionStore.write(userData)
    );
  },

  getSession() {
    return withErrorContext('Erro ao buscar sessão ativa', sessionStore.read);
  },

  // E-mail da conta conectada, ou null
  async getCurrentUser() {
    const session = await this.getSession();
    return session?.usuario || null;
  },

  clearSession() {
    return withErrorContext('Erro ao encerrar a sessão', sessionStore.clear);
  },
};
