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
});
