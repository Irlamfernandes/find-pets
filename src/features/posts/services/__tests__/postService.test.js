import AsyncStorage from '@react-native-async-storage/async-storage';
import { postService } from '../postService';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('../../../../testing/memoryStorage').createAsyncStorageMock()
);

const post = (id, extra = {}) => ({ id, status: 'Perdido', ...extra });

describe('postService', () => {
  beforeEach(() => {
    AsyncStorage.__backend.reset();
    jest.clearAllMocks();
  });

  it('deve começar vazio e guardar o registro mais novo primeiro', async () => {
    await expect(postService.getPosts()).resolves.toEqual([]);

    await postService.savePost(post('1'));
    await expect(postService.savePost(post('2'))).resolves.toEqual([
      post('2'),
      post('1'),
    ]);
    await expect(postService.getPosts()).resolves.toEqual([
      post('2'),
      post('1'),
    ]);
  });

  it('deve atualizar os campos de um registro mantendo o id', async () => {
    await postService.savePost(post('1'));
    await postService.savePost(post('2'));

    const posts = await postService.updatePost('1', {
      id: 'outro',
      status: 'Encontrado',
    });

    expect(posts).toEqual([post('2'), post('1', { status: 'Encontrado' })]);
  });

  it('deve excluir apenas o registro indicado', async () => {
    await postService.savePost(post('1'));
    await postService.savePost(post('2'));

    await expect(postService.deletePost('1')).resolves.toEqual([post('2')]);
  });

  it('deve validar os dados recebidos', () => {
    expect(() => postService.savePost({})).toThrow('Dados do post inválidos.');
    expect(() => postService.savePost(null)).toThrow(
      'Dados do post inválidos.'
    );
    expect(() => postService.deletePost('')).toThrow(
      'ID da publicação é obrigatório.'
    );
    expect(() => postService.updatePost(null, {})).toThrow(
      'ID da publicação é obrigatório.'
    );
  });

  it('deve informar as falhas do armazenamento', async () => {
    const failure = new Error('indisponível');
    for (let i = 0; i < 4; i += 1) {
      AsyncStorage.getItem.mockRejectedValueOnce(failure);
    }

    await expect(postService.getPosts()).rejects.toThrow(
      'Erro ao carregar as publicações: indisponível'
    );
    await expect(postService.savePost(post('1'))).rejects.toThrow(
      'Erro ao salvar a publicação: indisponível'
    );
    await expect(postService.deletePost('1')).rejects.toThrow(
      'Erro ao excluir a publicação: indisponível'
    );
    await expect(postService.updatePost('1', {})).rejects.toThrow(
      'Erro ao atualizar a publicação: indisponível'
    );
  });
});
