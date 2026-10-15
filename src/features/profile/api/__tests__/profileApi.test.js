import { profileApi } from '../profileApi';
import { HttpError, request } from '../../../../shared/api/httpClient';

jest.mock('../../../../shared/api/httpClient', () => {
  const actual = jest.requireActual('../../../../shared/api/httpClient');
  return { ...actual, request: jest.fn() };
});

describe('profileApi', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deve buscar o perfil da conta', async () => {
    request.mockResolvedValue({ name: 'Ana' });

    await expect(profileApi.get('t')).resolves.toEqual({ name: 'Ana' });
    expect(request).toHaveBeenCalledWith('/profile', { token: 't' });
  });

  it('deve devolver null quando a conta ainda não tem perfil', async () => {
    request.mockRejectedValue(new HttpError(404, 'Perfil não encontrado.'));

    await expect(profileApi.get('t')).resolves.toBeNull();
  });

  it('deve repassar os outros erros', async () => {
    request.mockRejectedValue(new HttpError(401, 'Token inválido.'));

    await expect(profileApi.get('t')).rejects.toThrow('Token inválido.');
  });

  it('deve salvar o perfil', async () => {
    const profile = { name: 'Ana', whatsapp: '5511999999999', photoUrl: null };
    request.mockResolvedValue(profile);

    await profileApi.save('t', profile);

    expect(request).toHaveBeenCalledWith('/profile', {
      method: 'PUT',
      body: profile,
      token: 't',
    });
  });
});
