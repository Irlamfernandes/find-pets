import { authApi } from '../authApi';
import { request } from '../../../../shared/api/httpClient';

jest.mock('../../../../shared/api/httpClient', () => ({
  request: jest.fn().mockResolvedValue({ token: 't', email: 'ana@x.com' }),
}));

describe('authApi', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deve cadastrar e entrar enviando e-mail e senha', async () => {
    await authApi.register('ana@x.com', 'senha');
    await authApi.login('ana@x.com', 'senha');

    const body = { email: 'ana@x.com', password: 'senha' };
    expect(request).toHaveBeenNthCalledWith(1, '/auth/register', {
      method: 'POST',
      body,
    });
    expect(request).toHaveBeenNthCalledWith(2, '/auth/login', {
      method: 'POST',
      body,
    });
  });

  it('deve trocar a senha com o token da conta', async () => {
    await authApi.changePassword('token', 'nova');

    expect(request).toHaveBeenCalledWith('/auth/password', {
      method: 'PUT',
      body: { newPassword: 'nova' },
      token: 'token',
    });
  });
});
