import { pullProfile, pushProfile } from '../profileSync';
import { profileRepository } from '../../profile/data/profileRepository';
import { profileApi } from '../../profile/api/profileApi';
import { uploadPhoto } from '../../../shared/api/uploadsApi';
import { clearDatabase } from '../../../testing/database';

jest.mock('../../profile/api/profileApi');
jest.mock('../../../shared/api/uploadsApi', () => ({
  ...jest.requireActual('../../../shared/api/uploadsApi'),
  uploadPhoto: jest.fn().mockResolvedValue('http://api/foto.jpg'),
}));

const USER = 'ana@x.com';
const TOKEN = 'token-ana';
const PROFILE = { name: 'Ana', whatsapp: '5511999999999' };

describe('profileSync', () => {
  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  describe('pushProfile', () => {
    it('deve enviar o perfil alterado com a foto', async () => {
      await profileRepository.save(USER, {
        ...PROFILE,
        photoUri: 'file:///eu.jpg',
      });

      await pushProfile(TOKEN, USER);

      expect(uploadPhoto).toHaveBeenCalledWith(TOKEN, 'file:///eu.jpg');
      expect(profileApi.save).toHaveBeenCalledWith(TOKEN, {
        ...PROFILE,
        photoUrl: 'http://api/foto.jpg',
      });
      expect((await profileRepository.findRow(USER)).sync_status).toBe(
        'synced'
      );
    });

    it('não deve reenviar a mesma foto', async () => {
      await profileRepository.save(USER, {
        ...PROFILE,
        photoUri: 'file:///eu.jpg',
      });
      await pushProfile(TOKEN, USER);
      await profileRepository.save(USER, {
        ...PROFILE,
        name: 'Ana B',
        photoUri: 'file:///eu.jpg',
      });

      await pushProfile(TOKEN, USER);

      expect(uploadPhoto).toHaveBeenCalledTimes(1);
      expect(profileApi.save).toHaveBeenLastCalledWith(
        TOKEN,
        expect.objectContaining({ photoUrl: 'http://api/foto.jpg' })
      );
    });

    it('deve enviar sem foto, ou com a foto que já está no servidor', async () => {
      await profileRepository.save(USER, PROFILE);
      await pushProfile(TOKEN, USER);
      expect(profileApi.save).toHaveBeenLastCalledWith(
        TOKEN,
        expect.objectContaining({ photoUrl: null })
      );

      await profileRepository.save(USER, {
        ...PROFILE,
        photoUri: 'http://api/de-outro-celular.jpg',
      });
      await pushProfile(TOKEN, USER);
      expect(profileApi.save).toHaveBeenLastCalledWith(
        TOKEN,
        expect.objectContaining({ photoUrl: 'http://api/de-outro-celular.jpg' })
      );
      expect(uploadPhoto).not.toHaveBeenCalled();
    });

    it('não deve enviar nada sem alteração pendente', async () => {
      await pushProfile(TOKEN, USER);
      await profileRepository.saveSynced(USER, {
        ...PROFILE,
        photoUrl: null,
        updatedAt: 'x',
      });
      await pushProfile(TOKEN, USER);

      expect(profileApi.save).not.toHaveBeenCalled();
    });
  });

  describe('pullProfile', () => {
    it('deve trazer o perfil da conta num celular novo', async () => {
      profileApi.get.mockResolvedValue({
        ...PROFILE,
        photoUrl: null,
        updatedAt: '2026-10-15T10:00:00.000Z',
      });

      await pullProfile(TOKEN, USER);

      await expect(profileRepository.findByUser(USER)).resolves.toEqual(
        PROFILE
      );
    });

    it('não deve gravar nada quando a conta ainda não tem perfil', async () => {
      profileApi.get.mockResolvedValue(null);

      await pullProfile(TOKEN, USER);

      await expect(profileRepository.findByUser(USER)).resolves.toBeNull();
    });

    it('não deve sobrescrever alteração local ainda não enviada', async () => {
      await profileRepository.save(USER, PROFILE);

      await pullProfile(TOKEN, USER);

      expect(profileApi.get).not.toHaveBeenCalled();
    });
  });
});
