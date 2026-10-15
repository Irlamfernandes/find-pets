import { profileService } from '../profileService';
import { sessionService } from '../../../auth/services/sessionService';
import { profileRepository } from '../../data/profileRepository';
import { clearDatabase, selectRows } from '../../../../testing/database';

const PROFILE = { name: 'Ana', whatsapp: '5511999999999' };

const loginAs = (usuario) => sessionService.saveSession({ usuario });

describe('profileService', () => {
  beforeEach(async () => {
    await clearDatabase();
    await sessionService.clearSession();
    jest.restoreAllMocks();
  });

  it('deve guardar o perfil de cada conta separadamente', async () => {
    await loginAs('ana@x.com');
    await expect(profileService.saveProfile(PROFILE)).resolves.toEqual(PROFILE);

    await loginAs('bia@x.com');
    await profileService.saveProfile({ ...PROFILE, name: 'Bia' });
    await expect(profileService.getProfile()).resolves.toEqual({
      ...PROFILE,
      name: 'Bia',
    });

    await loginAs('ana@x.com');
    await expect(profileService.getProfile()).resolves.toEqual(PROFILE);

    await loginAs('caio@x.com');
    await expect(profileService.getProfile()).resolves.toBeNull();
  });

  it('deve atualizar o perfil existente, com ou sem foto', async () => {
    await loginAs('ana@x.com');
    await profileService.saveProfile({ ...PROFILE, photoUri: 'foto.jpg' });
    await expect(profileService.getProfile()).resolves.toEqual({
      ...PROFILE,
      photoUri: 'foto.jpg',
    });

    await profileService.saveProfile({ ...PROFILE, name: 'Ana B' });

    await expect(profileService.getProfile()).resolves.toEqual({
      ...PROFILE,
      name: 'Ana B',
    });
    // Continua uma linha só
    await expect(selectRows('SELECT * FROM profiles')).resolves.toHaveLength(1);
  });

  it('deve exigir nome e WhatsApp', async () => {
    await expect(profileService.saveProfile({ name: 'Ana' })).rejects.toThrow(
      'Dados inválidos para salvamento do perfil.'
    );
    await expect(profileService.saveProfile(null)).rejects.toThrow(
      'Dados inválidos para salvamento do perfil.'
    );
  });

  it('não deve salvar nem ler perfil sem conta conectada', async () => {
    await expect(profileService.saveProfile(PROFILE)).rejects.toThrow(
      'Erro ao salvar perfil: Nenhuma conta conectada.'
    );
    await expect(profileService.getProfile()).resolves.toBeNull();
  });

  it('deve informar a falha ao ler', async () => {
    await loginAs('ana@x.com');
    jest
      .spyOn(profileRepository, 'findByUser')
      .mockRejectedValueOnce(new Error('indisponível'));

    await expect(profileService.getProfile()).rejects.toThrow(
      'Erro ao buscar perfil: indisponível'
    );
  });
});
