import { request } from '../../../shared/api/httpClient';

// Rotas de conta da API. Login e cadastro devolvem { token, email }.
export const authApi = {
  register(email, password) {
    return request('/auth/register', {
      method: 'POST',
      body: { email, password },
    });
  },

  login(email, password) {
    return request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  changePassword(token, newPassword) {
    return request('/auth/password', {
      method: 'PUT',
      body: { newPassword },
      token,
    });
  },
};
