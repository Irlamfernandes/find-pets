import AsyncStorage from '@react-native-async-storage/async-storage';
import { pullPosts, pushPosts } from '../postSync';
import { postRepository } from '../../posts/data/postRepository';
import { postsApi } from '../../posts/api/postsApi';
import { uploadPhoto } from '../../../shared/api/uploadsApi';
import { HttpError, OfflineError } from '../../../shared/api/httpClient';
import { clearDatabase, selectRows } from '../../../testing/database';

jest.mock('../../posts/api/postsApi');
jest.mock('../../../shared/api/uploadsApi', () => ({
  ...jest.requireActual('../../../shared/api/uploadsApi'),
  uploadPhoto: jest.fn(async (token, uri) => `http://api/${uri.slice(8)}`),
}));

const TOKEN = 'token-ana';

const localPost = (id, images = [`file:///${id}.jpg`]) => ({
  id,
  author: 'ana@x.com',
  status: 'Perdido',
  petName: `Pet ${id}`,
  images,
});

// O servidor devolve o registro como recebeu, já com as datas dele
const echoServer = () =>
  postsApi.save.mockImplementation(async (token, post) => ({
    ...post,
    serverUpdatedAt: '2026-10-15T12:00:00.000Z',
  }));

const syncStatusOf = async (id) =>
  (await selectRows('SELECT sync_status FROM posts WHERE id = ?', [id]))[0]
    .sync_status;

describe('postSync', () => {
  beforeEach(async () => {
    await clearDatabase();
    AsyncStorage.__backend.reset();
    jest.clearAllMocks();
    echoServer();
  });

  describe('pushPosts', () => {
    it('deve enviar as fotos e o registro feitos offline', async () => {
      await postRepository.insert(localPost('1'));

      await pushPosts(TOKEN);

      expect(uploadPhoto).toHaveBeenCalledWith(TOKEN, 'file:///1.jpg');
      expect(postsApi.save).toHaveBeenCalledWith(
        TOKEN,
        expect.objectContaining({
          id: '1',
          petName: 'Pet 1',
          images: ['http://api/1.jpg'],
          deletedAt: null,
        })
      );
      await expect(syncStatusOf('1')).resolves.toBe('synced');
      // A foto continua sendo o arquivo do celular (abre offline)
      expect((await postRepository.findActive())[0].images).toEqual([
        'file:///1.jpg',
      ]);
    });

    it('não deve reenviar fotos já enviadas nem as que vieram do servidor', async () => {
      await postRepository.insert(
        localPost('1', ['file:///1.jpg', 'http://api/de-outro.jpg'])
      );
      await pushPosts(TOKEN);
      await postRepository.update('1', { petName: 'Rex' });

      await pushPosts(TOKEN);

      expect(uploadPhoto).toHaveBeenCalledTimes(1);
      expect(postsApi.save).toHaveBeenLastCalledWith(
        TOKEN,
        expect.objectContaining({
          petName: 'Rex',
          images: ['http://api/1.jpg', 'http://api/de-outro.jpg'],
        })
      );
    });

    it('deve enviar a exclusão feita offline', async () => {
      await postRepository.insert(localPost('1'));
      await postRepository.softDelete('1');

      await pushPosts(TOKEN);

      const [, sent] = postsApi.save.mock.calls[0];
      expect(sent.deletedAt).toEqual(expect.any(String));
      await expect(syncStatusOf('1')).resolves.toBe('synced');
    });

    it('deve manter pendente o registro alterado durante o envio', async () => {
      await postRepository.insert(localPost('1'));
      postsApi.save.mockImplementationOnce(async (token, post) => {
        await postRepository.update('1', { petName: 'Mudou' });
        return post;
      });

      await pushPosts(TOKEN);

      await expect(syncStatusOf('1')).resolves.toBe('pending');
    });

    it('deve continuar enviando os outros quando o servidor recusa um', async () => {
      await postRepository.insert(localPost('1'));
      await postRepository.insert(localPost('2'));
      postsApi.save.mockRejectedValueOnce(new HttpError(400, 'Inválido.'));

      await pushPosts(TOKEN);

      await expect(syncStatusOf('1')).resolves.toBe('pending');
      await expect(syncStatusOf('2')).resolves.toBe('synced');
    });

    it('deve parar quando estiver sem conexão ou sem autorização', async () => {
      await postRepository.insert(localPost('1'));

      postsApi.save.mockRejectedValueOnce(new OfflineError());
      await expect(pushPosts(TOKEN)).rejects.toBeInstanceOf(OfflineError);

      postsApi.save.mockRejectedValueOnce(new HttpError(401, 'Expirou.'));
      await expect(pushPosts(TOKEN)).rejects.toThrow('Expirou.');

      postsApi.save.mockRejectedValueOnce(new HttpError(503, 'Fora do ar.'));
      await expect(pushPosts(TOKEN)).rejects.toThrow('Fora do ar.');
    });
  });

  describe('pullPosts', () => {
    const remote = (id, serverUpdatedAt, extra = {}) => ({
      id,
      author: 'bia@x.com',
      status: 'Perdido',
      petName: `Remoto ${id}`,
      images: [`http://api/${id}.jpg`],
      createdAt: '2026-10-15T10:00:00.000Z',
      updatedAt: '2026-10-15T10:00:00.000Z',
      deletedAt: null,
      serverUpdatedAt,
      ...extra,
    });

    it('deve baixar os registros de outros usuários e lembrar até onde baixou', async () => {
      postsApi.listChangedSince.mockResolvedValueOnce([
        remote('r1', '2026-10-15T10:00:00.000Z'),
        remote('r2', '2026-10-15T11:00:00.000Z'),
      ]);

      await pullPosts(TOKEN, 'ana@x.com');

      expect(postsApi.listChangedSince).toHaveBeenCalledWith(
        TOKEN,
        '1970-01-01T00:00:00.000Z'
      );
      const posts = await postRepository.findActive();
      expect(posts.map((post) => post.id).sort()).toEqual(['r1', 'r2']);

      postsApi.listChangedSince.mockResolvedValueOnce([]);
      await pullPosts(TOKEN, 'ana@x.com');
      expect(postsApi.listChangedSince).toHaveBeenLastCalledWith(
        TOKEN,
        '2026-10-15T11:00:00.000Z'
      );
    });

    it('não deve sobrescrever alterações locais ainda não enviadas', async () => {
      await postRepository.insert(localPost('1'));
      postsApi.listChangedSince.mockResolvedValueOnce([
        remote('1', '2026-10-15T10:00:00.000Z', { petName: 'Do servidor' }),
      ]);

      await pullPosts(TOKEN, 'ana@x.com');

      expect((await postRepository.findActive())[0].petName).toBe('Pet 1');
    });
  });
});
