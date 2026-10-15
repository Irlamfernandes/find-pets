import { profileRepository } from '../profileRepository';
import { clearDatabase } from '../../../../testing/database';

const USER = 'ana@x.com';
const PROFILE = { name: 'Ana', whatsapp: '5511999999999' };
const REMOTE = {
  ...PROFILE,
  photoUrl: 'http://api/foto.jpg',
  updatedAt: '2026-10-15T10:00:00.000Z',
};

describe('profileRepository (sincronização)', () => {
  beforeEach(clearDatabase);

  it('deve deixar pendente o perfil alterado no celular', async () => {
    await profileRepository.save(USER, PROFILE);

    const row = await profileRepository.findRow(USER);

    expect(row).toMatchObject({ name: 'Ana', sync_status: 'pending' });
  });

  it('deve marcar como enviado só se o perfil não mudou no meio', async () => {
    await profileRepository.save(USER, PROFILE);
    const { updated_at: sentAt } = await profileRepository.findRow(USER);

    await profileRepository.markSynced(USER, 'outra-data');
    expect((await profileRepository.findRow(USER)).sync_status).toBe('pending');

    await profileRepository.markSynced(USER, sentAt);
    expect((await profileRepository.findRow(USER)).sync_status).toBe('synced');
  });

  it('deve reaproveitar a foto enviada até ela ser trocada', async () => {
    await profileRepository.save(USER, {
      ...PROFILE,
      photoUri: 'file:///a.jpg',
    });
    await profileRepository.setPhotoRemoteUrl(USER, 'http://api/a.jpg');

    await profileRepository.save(USER, {
      ...PROFILE,
      photoUri: 'file:///a.jpg',
    });
    expect((await profileRepository.findRow(USER)).photo_remote_url).toBe(
      'http://api/a.jpg'
    );

    await profileRepository.save(USER, {
      ...PROFILE,
      photoUri: 'file:///b.jpg',
    });
    expect((await profileRepository.findRow(USER)).photo_remote_url).toBeNull();
  });

  it('deve usar a foto do servidor num celular novo', async () => {
    await profileRepository.saveSynced(USER, REMOTE);

    await expect(profileRepository.findByUser(USER)).resolves.toEqual({
      ...PROFILE,
      photoUri: 'http://api/foto.jpg',
    });
    expect(await profileRepository.findRow(USER)).toMatchObject({
      sync_status: 'synced',
      updated_at: REMOTE.updatedAt,
    });
  });

  it('deve manter a foto do celular quando ela é a mesma do servidor', async () => {
    await profileRepository.save(USER, {
      ...PROFILE,
      photoUri: 'file:///a.jpg',
    });
    await profileRepository.setPhotoRemoteUrl(USER, REMOTE.photoUrl);

    await profileRepository.saveSynced(USER, REMOTE);

    expect((await profileRepository.findByUser(USER)).photoUri).toBe(
      'file:///a.jpg'
    );
  });

  it('deve aceitar perfil sem foto vindo do servidor', async () => {
    await profileRepository.saveSynced(USER, { ...REMOTE, photoUrl: null });

    await expect(profileRepository.findByUser(USER)).resolves.toEqual(PROFILE);
  });
});
