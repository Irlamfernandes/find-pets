import { postRepository } from '../postRepository';
import { postImageRepository } from '../postImageRepository';
import { clearDatabase, selectRows } from '../../../../testing/database';

const post = (id, extra = {}) => ({
  id,
  status: 'Perdido',
  images: [`${id}-1.jpg`, `${id}-2.jpg`],
  ...extra,
});

const activeImages = (postId) =>
  selectRows(
    'SELECT local_uri FROM post_images WHERE post_id = ? AND deleted_at IS NULL ORDER BY position',
    [postId]
  ).then((rows) => rows.map((row) => row.local_uri));

describe('postRepository', () => {
  beforeEach(clearDatabase);

  it('deve gravar o registro com as fotos e listar o mais novo primeiro', async () => {
    await postRepository.insert(post('1'));
    await postRepository.insert(post('2'));

    const posts = await postRepository.findActive();

    expect(posts.map((item) => item.id)).toEqual(['2', '1']);
    expect(posts[1].images).toEqual(['1-1.jpg', '1-2.jpg']);
  });

  it('deve aceitar um registro sem fotos', async () => {
    await postRepository.insert(post('1', { images: [] }));

    const [semFoto] = await postRepository.findActive();

    expect(semFoto.images).toEqual([]);
  });

  it('deve marcar os novos registros como pendentes de envio para a nuvem', async () => {
    await postRepository.insert(post('1'));

    const [row] = await selectRows('SELECT * FROM posts');

    expect(row).toMatchObject({ sync_status: 'pending', deleted_at: null });
    expect(row.created_at).toBe(row.updated_at);
  });

  it('deve alterar os campos e trocar as fotos, guardando as que saíram', async () => {
    await postRepository.insert(post('1', { petName: 'Rex' }));

    await postRepository.update('1', {
      id: 'outro',
      status: 'Encontrado',
      images: ['1-2.jpg', 'nova.jpg'],
    });

    const [updated] = await postRepository.findActive();
    expect(updated).toMatchObject({
      id: '1',
      petName: 'Rex',
      status: 'Encontrado',
      images: ['1-2.jpg', 'nova.jpg'],
    });
    const removed = await selectRows(
      'SELECT local_uri FROM post_images WHERE deleted_at IS NOT NULL'
    );
    expect(removed).toEqual([{ local_uri: '1-1.jpg' }]);
  });

  it('deve reativar uma foto que tinha saído do registro', async () => {
    await postRepository.insert(post('1'));
    await postRepository.update('1', { images: ['1-2.jpg'] });

    await postRepository.update('1', { images: ['1-1.jpg', '1-2.jpg'] });

    await expect(activeImages('1')).resolves.toEqual(['1-1.jpg', '1-2.jpg']);
    const rows = await selectRows('SELECT id FROM post_images');
    expect(rows).toHaveLength(2);
  });

  it('deve manter as fotos quando a alteração não as informa', async () => {
    await postRepository.insert(post('1'));

    await postRepository.update('1', { status: 'Encontrado' });

    await expect(activeImages('1')).resolves.toEqual(['1-1.jpg', '1-2.jpg']);
  });

  it('deve ignorar a alteração de um registro inexistente ou excluído', async () => {
    await postRepository.insert(post('1'));
    await postRepository.softDelete('1');

    await postRepository.update('1', { petName: 'Rex' });
    await postRepository.update('2', { petName: 'Rex' });

    const rows = await selectRows('SELECT id, pet_name FROM posts');
    expect(rows).toEqual([{ id: '1', pet_name: null }]);
  });

  it('deve excluir só logicamente: some da lista, mas fica no banco', async () => {
    await postRepository.insert(post('1'));
    await postRepository.insert(post('2'));

    await postRepository.softDelete('1');

    const posts = await postRepository.findActive();
    expect(posts.map((item) => item.id)).toEqual(['2']);
    const [deleted] = await selectRows('SELECT * FROM posts WHERE id = ?', [
      '1',
    ]);
    expect(deleted.deleted_at).toEqual(expect.any(String));
    // As fotos continuam ligadas ao registro excluído, como histórico
    await expect(activeImages('1')).resolves.toHaveLength(2);
  });

  describe('sincronização', () => {
    const remote = (extra = {}) => ({
      id: 'r1',
      author: 'bia@x.com',
      petName: 'Mel',
      status: 'Perdido',
      images: ['http://api/uploads/a.jpg'],
      createdAt: '2026-10-10T10:00:00.000Z',
      updatedAt: '2026-10-10T11:00:00.000Z',
      deletedAt: null,
      ...extra,
    });

    it('deve listar os pendentes de envio, inclusive os excluídos', async () => {
      await postRepository.insert(post('1'));
      await postRepository.insert(post('2'));
      await postRepository.softDelete('2');
      await postRepository.saveSynced(remote());

      const pending = await postRepository.findPendingRows();

      expect(pending.map((row) => [row.id, Boolean(row.deleted_at)])).toEqual([
        ['1', false],
        ['2', true],
      ]);
    });

    it('deve gravar o registro de outro usuário como já sincronizado', async () => {
      await postRepository.saveSynced(remote());

      const [saved] = await postRepository.findActive();
      expect(saved).toMatchObject({
        id: 'r1',
        author: 'bia@x.com',
        petName: 'Mel',
        images: ['http://api/uploads/a.jpg'],
        syncStatus: 'synced',
      });
      await expect(postRepository.findUpdatedAt('r1')).resolves.toBe(
        '2026-10-10T11:00:00.000Z'
      );
      await expect(
        postRepository.findUpdatedAt('nao-existe')
      ).resolves.toBeNull();
    });

    it('deve aplicar alterações e exclusões que vieram do servidor', async () => {
      await postRepository.saveSynced(remote());

      await postRepository.saveSynced(
        remote({ petName: 'Mel 2', images: ['http://api/uploads/b.jpg'] })
      );
      expect((await postRepository.findActive())[0]).toMatchObject({
        petName: 'Mel 2',
        images: ['http://api/uploads/b.jpg'],
      });

      await postRepository.saveSynced(
        remote({ deletedAt: '2026-10-11T10:00:00.000Z' })
      );
      await expect(postRepository.findActive()).resolves.toEqual([]);
    });

    it('deve manter a foto do celular quando ela já foi enviada', async () => {
      await postRepository.insert(post('1', { images: ['file:///1.jpg'] }));
      const [image] = await postImageRepository.findActiveOfPost('1');
      await postImageRepository.setRemoteUrl(image.id, 'http://api/1.jpg');

      await postRepository.saveSynced(
        remote({ id: '1', author: 'ana@x.com', images: ['http://api/1.jpg'] })
      );

      const [saved] = await postRepository.findActive();
      expect(saved.images).toEqual(['file:///1.jpg']);
      expect(saved.syncStatus).toBe('synced');
      await expect(postImageRepository.findActiveOfPost('1')).resolves.toEqual([
        {
          id: image.id,
          local_uri: 'file:///1.jpg',
          remote_url: 'http://api/1.jpg',
        },
      ]);
    });
  });
});
