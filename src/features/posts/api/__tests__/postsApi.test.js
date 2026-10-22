import { postsApi } from '../postsApi';
import { readFirebase, resetFirebase } from '../../../../testing/firebaseMock';

const post = (updatedAt, extra = {}) => ({
  id: 'p1',
  petName: 'Rex',
  images: ['data:image/jpeg;base64,A'],
  updatedAt,
  ...extra,
});

describe('postsApi', () => {
  beforeEach(() => resetFirebase());

  it('deve gravar o registro e devolvê-lo', async () => {
    const sent = post('2026-10-15T10:00:00.000Z');

    await expect(postsApi.save(sent)).resolves.toBe(sent);
    expect(readFirebase('posts/p1')).toEqual({ ...sent, serverUpdatedAt: 1 });
  });

  it('deve substituir a versão da nuvem por uma mais nova', async () => {
    await postsApi.save(post('2026-10-15T10:00:00.000Z'));

    await postsApi.save(post('2026-10-15T12:00:00.000Z', { petName: 'Thor' }));

    expect(readFirebase('posts/p1').petName).toBe('Thor');
  });

  it('deve manter a versão da nuvem quando ela é mais nova', async () => {
    await postsApi.save(post('2026-10-15T12:00:00.000Z', { images: [] }));

    await expect(
      postsApi.save(post('2026-10-15T10:00:00.000Z', { petName: 'Velho' }))
    ).resolves.toEqual({
      ...post('2026-10-15T12:00:00.000Z'),
      images: [],
      serverUpdatedAt: 1,
    });
    expect(readFirebase('posts/p1').petName).toBe('Rex');
  });

  it('deve listar o que mudou, com a lista de fotos sempre presente', async () => {
    await postsApi.save(post('2026-10-15T10:00:00.000Z', { images: [] }));
    await postsApi.save(post('2026-10-15T10:00:00.000Z', { id: 'p2' }));

    await expect(postsApi.listChangedSince(0)).resolves.toEqual([
      { ...post('2026-10-15T10:00:00.000Z'), images: [], serverUpdatedAt: 1 },
      { ...post('2026-10-15T10:00:00.000Z', { id: 'p2' }), serverUpdatedAt: 2 },
    ]);
    await expect(postsApi.listChangedSince(3)).resolves.toEqual([]);
  });
});
