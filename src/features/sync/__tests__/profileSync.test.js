import { pullProfile, pushProfile } from '../profileSync';
import { profileRepository } from '../../profile/data/profileRepository';
import { writeValue } from '../../../shared/firebase/realtimeDatabase';
import { clearDatabase } from '../../../testing/database';
import { readFirebase, resetFirebase } from '../../../testing/firebaseMock';

const USER = 'ana@x.com';
const UID = 'uid-ana';
const PROFILE = { name: 'Ana', whatsapp: '5511999999999' };
const PHOTO = 'data:image/jpeg;base64,foto(file:///eu.jpg)';

describe('profileSync', () => {
  beforeEach(async () => {
    await clearDatabase();
    resetFirebase();
  });

  describe('pushProfile', () => {
    it('deve enviar o perfil alterado com a foto', async () => {
      await profileRepository.save(USER, {
        ...PROFILE,
        photoUri: 'file:///eu.jpg',
      });

      await pushProfile(UID, USER);

      expect(readFirebase(`profiles/${UID}`)).toMatchObject({
        ...PROFILE,
        photoUrl: PHOTO,
        updatedAt: expect.any(String),
      });
      expect((await profileRepository.findRow(USER)).sync_status).toBe(
        'synced'
      );
    });

    it('não deve converter de novo a mesma foto', async () => {
      await profileRepository.save(USER, {
        ...PROFILE,
        photoUri: 'file:///eu.jpg',
      });
      await pushProfile(UID, USER);
      await profileRepository.save(USER, {
        ...PROFILE,
        name: 'Ana B',
        photoUri: 'file:///eu.jpg',
      });

      await pushProfile(UID, USER);

      expect((await profileRepository.findRow(USER)).photo_remote_url).toBe(
        PHOTO
      );
      expect(readFirebase(`profiles/${UID}`)).toMatchObject({
        name: 'Ana B',
        photoUrl: PHOTO,
      });
    });

    it('deve enviar sem foto, ou com a foto que já está na nuvem', async () => {
      await profileRepository.save(USER, PROFILE);
      await pushProfile(UID, USER);
      expect(readFirebase(`profiles/${UID}`).photoUrl).toBeUndefined();

      const fromOtherPhone = 'data:image/jpeg;base64,OUTRO';
      await profileRepository.save(USER, {
        ...PROFILE,
        photoUri: fromOtherPhone,
      });
      await pushProfile(UID, USER);
      expect(readFirebase(`profiles/${UID}`).photoUrl).toBe(fromOtherPhone);
    });

    it('não deve enviar nada sem alteração pendente', async () => {
      await pushProfile(UID, USER);
      await profileRepository.saveSynced(USER, {
        ...PROFILE,
        updatedAt: '2026-10-15T10:00:00.000Z',
      });
      await pushProfile(UID, USER);

      expect(readFirebase('profiles')).toBeNull();
    });
  });

  describe('pullProfile', () => {
    it('deve trazer o perfil da conta num celular novo', async () => {
      await writeValue(`profiles/${UID}`, {
        ...PROFILE,
        updatedAt: '2026-10-15T10:00:00.000Z',
      });

      await pullProfile(UID, USER);

      await expect(profileRepository.findByUser(USER)).resolves.toEqual(
        PROFILE
      );
    });

    it('não deve gravar nada quando a conta ainda não tem perfil', async () => {
      await pullProfile(UID, USER);

      await expect(profileRepository.findByUser(USER)).resolves.toBeNull();
    });

    it('não deve sobrescrever alteração local ainda não enviada', async () => {
      await profileRepository.save(USER, PROFILE);
      await writeValue(`profiles/${UID}`, {
        name: 'Da nuvem',
        whatsapp: '5511888888888',
        updatedAt: '2026-10-15T10:00:00.000Z',
      });

      await pullProfile(UID, USER);

      await expect(profileRepository.findByUser(USER)).resolves.toEqual(
        PROFILE
      );
    });
  });
});
