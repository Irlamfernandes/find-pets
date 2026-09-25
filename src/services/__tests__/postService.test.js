// src/services/__tests__/postService.test.js
import { postService } from '../postService';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('Post Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar uma lista vazia quando não houver posts salvos', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);

    const posts = await postService.getPosts();
    expect(posts).toEqual([]);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.POSTS);
  });

  it('deve retornar os posts salvos convertidos em JSON', async () => {
    const mockPosts = [{ id: '1', type: 'Perdido' }];
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockPosts));

    const posts = await postService.getPosts();
    expect(posts).toEqual(mockPosts);
  });

  it('deve lançar erro se ocorrer falha ao buscar posts', async () => {
    AsyncStorage.getItem.mockRejectedValueOnce(new Error('Erro storage'));

    await expect(postService.getPosts()).rejects.toThrow(
      'Erro ao carregar as publicações: Erro storage'
    );
  });

  it('deve lançar erro se tentar salvar um post inválido ou sem id', async () => {
    await expect(postService.savePost(null)).rejects.toThrow(
      'Dados do post inválidos.'
    );

    await expect(postService.savePost({})).rejects.toThrow(
      'Dados do post inválidos.'
    );
  });

  it('deve salvar um novo post com sucesso', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([]));
    AsyncStorage.setItem.mockResolvedValueOnce();

    const newPost = { id: '2', type: 'Avistado' };
    const posts = await postService.savePost(newPost);

    expect(posts).toEqual([newPost]);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.POSTS,
      JSON.stringify([newPost])
    );
  });

  it('deve lançar erro se falhar ao salvar post', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([]));
    AsyncStorage.setItem.mockRejectedValueOnce(new Error('Erro storage'));

    await expect(postService.savePost({ id: '1' })).rejects.toThrow(
      'Erro ao salvar a publicação: Erro storage'
    );
  });

  it('deve excluir e persistir o post informado', async () => {
    const posts = [
      { id: '1', type: 'Perdido' },
      { id: '2', type: 'Avistado' },
    ];
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(posts));
    AsyncStorage.setItem.mockResolvedValueOnce();

    await expect(postService.deletePost('1')).resolves.toEqual([posts[1]]);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.POSTS,
      JSON.stringify([posts[1]])
    );
  });

  it('deve rejeitar exclusão sem ID', async () => {
    await expect(postService.deletePost('')).rejects.toThrow(
      'ID da publicação é obrigatório.'
    );
  });

  it('deve lançar erro se falhar ao excluir post', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([{ id: '1' }]));
    AsyncStorage.setItem.mockRejectedValueOnce(new Error('Erro storage'));

    await expect(postService.deletePost('1')).rejects.toThrow(
      'Erro ao excluir a publicação: Erro storage'
    );
  });

  it('deve atualizar e persistir o status da publicação', async () => {
    const posts = [
      { id: '1', type: 'Perdido', status: 'Perdido' },
      { id: '2', type: 'Perdido', status: 'Perdido' },
    ];
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(posts));
    AsyncStorage.setItem.mockResolvedValueOnce();

    await expect(
      postService.updatePostStatus('1', 'Encontrado')
    ).resolves.toEqual([{ ...posts[0], status: 'Encontrado' }, posts[1]]);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.POSTS,
      JSON.stringify([{ ...posts[0], status: 'Encontrado' }, posts[1]])
    );
  });

  it('deve rejeitar atualização sem ID ou status', async () => {
    await expect(
      postService.updatePostStatus('', 'Encontrado')
    ).rejects.toThrow('ID e status da publicação são obrigatórios.');
    await expect(postService.updatePostStatus('1', '')).rejects.toThrow(
      'ID e status da publicação são obrigatórios.'
    );
  });

  it('deve lançar erro se falhar ao atualizar o status', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([{ id: '1' }]));
    AsyncStorage.setItem.mockRejectedValueOnce(new Error('Erro storage'));

    await expect(
      postService.updatePostStatus('1', 'Encontrado')
    ).rejects.toThrow('Erro ao atualizar a publicação: Erro storage');
  });
});
