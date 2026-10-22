import { profileApi } from '../profileApi';
import { readFirebase, resetFirebase } from '../../../../testing/firebaseMock';

describe('profileApi', () => {
  beforeEach(() => resetFirebase());

  it('deve guardar e devolver o perfil de cada conta', async () => {
    await expect(profileApi.get('uid-ana')).resolves.toBeNull();

    await profileApi.save('uid-ana', { name: 'Ana', whatsapp: '5511' });

    expect(readFirebase('profiles/uid-ana')).toEqual({
      name: 'Ana',
      whatsapp: '5511',
      serverUpdatedAt: 1,
    });
    await expect(profileApi.get('uid-ana')).resolves.toMatchObject({
      name: 'Ana',
    });
  });
});
