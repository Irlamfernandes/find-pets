import { postService } from '../postService';
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
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('@FindPets:posts');
  });

  it('deve retornar os posts salvos convertidos em JSON', async () => {
    const mockPosts = [{ id: '1', type: 'Perdido' }];
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockPosts));

    const posts = await postService.getPosts();
    expect(posts).toEqual(mockPosts);
  });

  it('deve retornar array vazio se ocorrer erro ao buscar posts', async () => {
    AsyncStorage.getItem.mockRejectedValueOnce(new Error('Erro storage'));

    const posts = await postService.getPosts();
    expect(posts).toEqual([]);
  });

  it('deve salvar um novo post com sucesso', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([]));
    AsyncStorage.setItem.mockResolvedValueOnce();

    const newPost = { id: '2', type: 'Avistado' };
    const posts = await postService.savePost(newPost);

    expect(posts).toEqual([newPost]);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@FindPets:posts',
      JSON.stringify([newPost])
    );
  });

  it('deve lançar erro se falhar ao salvar post', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([]));
    AsyncStorage.setItem.mockRejectedValueOnce(new Error('Erro storage'));

    await expect(postService.savePost({ id: '1' })).rejects.toThrow(
      'Erro ao salvar a publicação.'
    );
  });
});
