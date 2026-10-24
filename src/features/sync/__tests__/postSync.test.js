import AsyncStorage from 'expo-sqlite/kv-store';
import { set } from 'firebase/database';
import { pullPosts, pushPosts } from '../postSync';
import { postRepository } from '../../posts/data/postRepository';
import { writeValue } from '../../../shared/firebase/realtimeDatabase';
import { OfflineError } from '../../../shared/firebase/remoteCall';
import { clearDatabase, selectRows } from '../../../testing/database';
import { readFirebase, resetFirebase } from '../../../testing/firebaseMock';

const UID = 'uid-ana';
const USER = 'ana@x.com';
const cloudPhoto = (uri) => `data:image/jpeg;base64,foto(${uri})`;

const localPost = (id, images = [`file:///${id}.jpg`], author = USER) => ({
  id,
  author,
  status: 'Perdido',
  petName: `Pet ${id}`,
  images,
});

const syncStatusOf = async (id) =>
  (await selectRows('SELECT sync_status FROM posts WHERE id = ?', [id]))[0]
    .sync_status;

describe('postSync', () => {
  beforeEach(async () => {
    await clearDatabase();
    AsyncStorage.__backend.reset();
    resetFirebase();
    jest.clearAllMocks();
  });

  describe('pushPosts', () => {
    it('deve enviar as fotos e o registro feitos offline', async () => {
      await postRepository.insert(localPost('1'));

      await pushPosts(UID, USER);

      expect(readFirebase('posts/1')).toMatchObject({
        id: '1',
        author: USER,
        authorUid: UID,
        petName: 'Pet 1',
        images: [cloudPhoto('file:///1.jpg')],
      });
      await expect(syncStatusOf('1')).resolves.toBe('synced');
      // A foto continua sendo o arquivo do celular (abre offline)
      expect((await postRepository.findActive())[0].images).toEqual([
        'file:///1.jpg',
      ]);
    });

    it('não deve converter de novo fotos já enviadas nem as que vieram da nuvem', async () => {
      const fromOtherPhone = 'data:image/jpeg;base64,OUTRO';
      await postRepository.insert(
        localPost('1', ['file:///1.jpg', fromOtherPhone])
      );
      await pushPosts(UID, USER);
      await postRepository.update('1', { petName: 'Rex' });

      await pushPosts(UID, USER);

      expect(readFirebase('posts/1')).toMatchObject({
        petName: 'Rex',
        images: [cloudPhoto('file:///1.jpg'), fromOtherPhone],
      });
    });

    it('deve enviar a exclusão feita offline', async () => {
      await postRepository.insert(localPost('1'));
      await postRepository.softDelete('1');

      await pushPosts(UID, USER);

      expect(readFirebase('posts/1').deletedAt).toEqual(expect.any(String));
      await expect(syncStatusOf('1')).resolves.toBe('synced');
    });

    it('deve manter a versão da nuvem quando ela é mais nova', async () => {
      await postRepository.insert(localPost('1'));
      await writeValue('posts/1', {
        ...localPost('1', []),
        petName: 'Editado em outro celular',
        createdAt: '2026-10-15T10:00:00.000Z',
        updatedAt: '2999-01-01T00:00:00.000Z',
      });

      await pushPosts(UID, USER);

      expect(readFirebase('posts/1').petName).toBe('Editado em outro celular');
      const [post] = await postRepository.findActive();
      expect(post).toMatchObject({
        petName: 'Editado em outro celular',
        images: [],
        syncStatus: 'synced',
      });
    });

    it('deve manter pendente o registro alterado durante o envio', async () => {
      await postRepository.insert(localPost('1'));
      set.mockImplementationOnce(async () => {
        await postRepository.update('1', { petName: 'Mudou' });
      });

      await pushPosts(UID, USER);

      await expect(syncStatusOf('1')).resolves.toBe('pending');
    });

    it('deve enviar só os registros da conta conectada', async () => {
      await postRepository.insert(localPost('1'));
      await postRepository.insert(localPost('2', [], 'bia@x.com'));

      await pushPosts(UID, USER);

      expect(readFirebase('posts/2')).toBeNull();
      await expect(syncStatusOf('2')).resolves.toBe('pending');
    });

    it('deve parar quando estiver sem conexão', async () => {
      await postRepository.insert(localPost('1'));
      set.mockRejectedValueOnce(new Error('Client is offline.'));

      await expect(pushPosts(UID, USER)).rejects.toBeInstanceOf(OfflineError);
      await expect(syncStatusOf('1')).resolves.toBe('pending');
    });
  });

  describe('pullPosts', () => {
    const remote = (id, extra = {}) => ({
      id,
      author: 'bia@x.com',
      authorUid: 'uid-bia',
      status: 'Perdido',
      petName: `Remoto ${id}`,
      images: [`data:image/jpeg;base64,${id}`],
      createdAt: '2026-10-15T10:00:00.000Z',
      updatedAt: '2026-10-15T10:00:00.000Z',
      ...extra,
    });

    it('deve baixar os registros de outros usuários e lembrar até onde baixou', async () => {
      await writeValue('posts/r1', remote('r1'));
      await writeValue('posts/r2', remote('r2', { images: [] }));

      await pullPosts(USER);

      const posts = await postRepository.findActive();
      expect(posts.map((post) => post.id).sort()).toEqual(['r1', 'r2']);
      expect(posts.find((post) => post.id === 'r2').images).toEqual([]);

      // Na próxima vez, só o que mudou depois do último baixado
      await writeValue('posts/r1', remote('r1', { petName: 'Achado' }));
      await pullPosts(USER);
      const updated = await postRepository.findActive();
      expect(updated.find((post) => post.id === 'r1').petName).toBe('Achado');
    });

    it('não deve mudar nada quando a nuvem ainda está vazia', async () => {
      await pullPosts(USER);

      await expect(postRepository.findActive()).resolves.toEqual([]);
      await expect(
        AsyncStorage.getItem('FindPets_firebase_cursors')
      ).resolves.toBeNull();
    });

    it('deve baixar as exclusões feitas em outro celular', async () => {
      await writeValue('posts/r1', remote('r1'));
      await pullPosts(USER);

      await writeValue(
        'posts/r1',
        remote('r1', { deletedAt: '2026-10-15T11:00:00.000Z' })
      );
      await pullPosts(USER);

      await expect(postRepository.findActive()).resolves.toEqual([]);
    });

    it('não deve sobrescrever alterações locais ainda não enviadas', async () => {
      await postRepository.insert(localPost('1'));
      await writeValue('posts/1', remote('1', { petName: 'Da nuvem' }));

      await pullPosts(USER);

      expect((await postRepository.findActive())[0].petName).toBe('Pet 1');
    });
  });
});
