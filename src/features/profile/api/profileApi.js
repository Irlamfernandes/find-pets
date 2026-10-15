import { HttpError, request } from '../../../shared/api/httpClient';

// Rotas do perfil da API
export const profileApi = {
  // Perfil da conta no servidor, ou null se ela ainda não tiver um
  async get(token) {
    try {
      return await request('/profile', { token });
    } catch (error) {
      if (error instanceof HttpError && error.status === 404) return null;
      throw error;
    }
  },

  save(token, profile) {
    return request('/profile', { method: 'PUT', body: profile, token });
  },
};
