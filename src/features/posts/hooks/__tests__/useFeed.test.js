import { renderHook, act } from '@testing-library/react-native';
import { useFeed } from '../useFeed';
import { postService } from '../../services/postService';
import { postPhotoStorage } from '../../../../shared/services/photoStorage';
import { profileService } from '../../../profile/services/profileService';
import { sessionService } from '../../../auth/services/sessionService';
import { Alert } from 'react-native';

jest.mock('../../services/postService', () => ({
  postService: {
    getPosts: jest.fn(),
    savePost: jest.fn(),
    deletePost: jest.fn(),
    updatePost: jest.fn(),
  },
}));

jest.mock('../../../../shared/services/photoStorage', () => ({
  postPhotoStorage: { removeAll: jest.fn() },
}));

jest.mock('../../../profile/services/profileService', () => ({
  profileService: { getProfile: jest.fn() },
}));

jest.mock('../../../auth/services/sessionService', () => ({
  sessionService: { getCurrentUser: jest.fn() },
}));

jest.spyOn(Alert, 'alert');

describe('useFeed Hook - 100% Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    profileService.getProfile.mockResolvedValue({
      name: 'Irlam',
      whatsapp: '11999999999',
    });
    sessionService.getCurrentUser.mockResolvedValue('user1@test.com');
  });

  it('deve carregar os posts e o perfil do usuário com sucesso', async () => {
    const mockPosts = [{ id: '1', type: 'Perdido' }];
    postService.getPosts.mockResolvedValueOnce(mockPosts);

    const { result } = renderHook(() => useFeed());

    await act(async () => {});

    expect(result.current.posts).toEqual(mockPosts);
    expect(result.current.userName).toBe('Irlam');
  });

  it('deve definir posts como array vazio e userName vazio se falhar ao carregar', async () => {
    postService.getPosts.mockRejectedValueOnce(new Error('Erro posts'));
    profileService.getProfile.mockRejectedValueOnce(new Error('Erro perfil'));
    sessionService.getCurrentUser.mockRejectedValueOnce(
      new Error('Erro sessão')
    );

    const { result } = renderHook(() => useFeed());

    await act(async () => {});

    expect(result.current.posts).toEqual([]);
    expect(result.current.userName).toBe('');
  });

  it('deve lidar com perfil sem nome ou nulo graciosamente', async () => {
    postService.getPosts.mockResolvedValueOnce([]);
    profileService.getProfile.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useFeed());

    await act(async () => {});

    expect(result.current.userName).toBe('');
  });

  it('deve excluir um post com sucesso ao confirmar no alerta', async () => {
    const mockPosts = [
      {
        id: '1',
        type: 'Perdido',
        author: 'user1@test.com',
        images: ['file:///docs/post-photo-1.jpg'],
      },
    ];
    postService.getPosts.mockResolvedValueOnce(mockPosts);
    postService.deletePost.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useFeed());
    await act(async () => {});

    await act(async () => {
      await result.current.deletePost('1');
    });

    const alertCall = Alert.alert.mock.calls.find(
      (call) => call[0] === 'Confirmar Exclusão'
    );
    const deleteButton = alertCall[2].find((btn) => btn.text === 'Excluir');

    await act(async () => {
      await deleteButton.onPress();
    });

    expect(result.current.posts).toEqual([]);
    // As fotos do registro excluído são apagadas do aparelho
    expect(postPhotoStorage.removeAll).toHaveBeenCalledWith([
      'file:///docs/post-photo-1.jpg',
    ]);
  });

  it('não deve abrir confirmação para excluir post de outro usuário', async () => {
    const mockPosts = [{ id: '1', type: 'Perdido', author: 'user2@test.com' }];
    postService.getPosts.mockResolvedValueOnce(mockPosts);

    const { result } = renderHook(() => useFeed());
    await act(async () => {});

    await act(async () => {
      await result.current.deletePost('1');
    });

    expect(Alert.alert).not.toHaveBeenCalledWith(
      'Confirmar Exclusão',
      expect.anything(),
      expect.anything()
    );
    expect(result.current.posts).toEqual(mockPosts);
  });

  it('deve exibir erro quando a exclusão persistida falhar', async () => {
    const mockPosts = [{ id: '1', type: 'Perdido', author: 'user1@test.com' }];
    postService.getPosts.mockResolvedValueOnce(mockPosts);
    postService.deletePost.mockRejectedValueOnce(new Error('Erro storage'));

    const { result } = renderHook(() => useFeed());
    await act(async () => {});

    await act(async () => {
      await result.current.deletePost('1');
    });

    const alertCall = Alert.alert.mock.calls.find(
      (call) => call[0] === 'Confirmar Exclusão'
    );
    const deleteButton = alertCall[2].find((btn) => btn.text === 'Excluir');

    await act(async () => {
      await deleteButton.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Não foi possível excluir',
      'Tente novamente em alguns instantes.'
    );
  });

  it('deve excluir um post com sucesso ao confirmar no alerta', async () => {
    const mockPosts = [{ id: '1', type: 'Perdido', author: 'user1@test.com' }];
    postService.getPosts.mockResolvedValueOnce(mockPosts);
    postService.deletePost.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useFeed());
    await act(async () => {});

    await act(async () => {
      await result.current.deletePost('1');
    });

    const alertCall = Alert.alert.mock.calls.find(
      (call) => call[0] === 'Confirmar Exclusão'
    );
    const deleteButton = alertCall[2].find((btn) => btn.text === 'Excluir');

    await act(async () => {
      await deleteButton.onPress();
    });

    expect(result.current.posts).toEqual([]);
    expect(postService.deletePost).toHaveBeenCalledWith('1');
  });

  it('deve abrir o formulário e salvar o reencontro mantendo o post no feed', async () => {
    const mockPosts = [{ id: '1', type: 'Perdido', author: 'user1@test.com' }];
    const foundInfo = {
      receiverName: 'Ana',
      receiverRelation: 'Dono(a) / tutor',
      foundAt: '2026-09-25T12:00:00.000Z',
      foundLocation: '',
      notes: '',
    };
    const updatedPosts = [{ ...mockPosts[0], status: 'Encontrado', foundInfo }];
    postService.getPosts.mockResolvedValueOnce(mockPosts);
    postService.updatePost.mockResolvedValueOnce(updatedPosts);

    const { result } = renderHook(() => useFeed());
    await act(async () => {});
    expect(result.current.isFoundFormOpen).toBe(false);

    expect(result.current.foundPost).toBeNull();
    act(() => result.current.markPostAsFound('1'));
    expect(result.current.isFoundFormOpen).toBe(true);
    expect(result.current.foundPost).toEqual(mockPosts[0]);

    await act(async () => {
      await result.current.confirmFound(foundInfo);
    });

    expect(postService.updatePost).toHaveBeenCalledWith('1', {
      status: 'Encontrado',
      foundInfo,
    });
    expect(result.current.posts).toEqual(updatedPosts);
    expect(result.current.isFoundFormOpen).toBe(false);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Que notícia boa!',
      'O reencontro foi registrado e o card continuará no feed.'
    );
  });

  it('deve fechar o formulário ao cancelar', async () => {
    postService.getPosts.mockResolvedValueOnce([
      { id: '1', type: 'Perdido', author: 'user1@test.com' },
    ]);

    const { result } = renderHook(() => useFeed());
    await act(async () => {});

    act(() => result.current.markPostAsFound('1'));
    act(() => result.current.cancelFound());

    expect(result.current.isFoundFormOpen).toBe(false);
    expect(postService.updatePost).not.toHaveBeenCalled();
  });

  it('não deve abrir o formulário para post de outro usuário, já encontrado ou inexistente', async () => {
    const mockPosts = [
      { id: '1', type: 'Perdido', author: 'user2@test.com' },
      {
        id: '2',
        type: 'Perdido',
        author: 'user1@test.com',
        status: 'Encontrado',
      },
    ];
    postService.getPosts.mockResolvedValueOnce(mockPosts);

    const { result } = renderHook(() => useFeed());
    await act(async () => {});
    act(() => {
      result.current.markPostAsFound('1');
      result.current.markPostAsFound('2');
      result.current.markPostAsFound('999');
    });

    expect(result.current.isFoundFormOpen).toBe(false);
  });

  it('não deve abrir o formulário sem usuário logado', async () => {
    postService.getPosts.mockResolvedValueOnce([
      { id: '1', type: 'Perdido', author: 'user1@test.com' },
    ]);
    sessionService.getCurrentUser.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useFeed());
    await act(async () => {});
    act(() => result.current.markPostAsFound('1'));

    expect(result.current.isFoundFormOpen).toBe(false);
  });

  it('deve manter o formulário aberto e avisar quando falhar ao salvar', async () => {
    postService.getPosts.mockResolvedValueOnce([
      { id: '1', type: 'Perdido', author: 'user1@test.com' },
    ]);
    postService.updatePost.mockRejectedValueOnce(new Error('Erro storage'));

    const { result } = renderHook(() => useFeed());
    await act(async () => {});
    act(() => result.current.markPostAsFound('1'));
    await act(async () => {
      await result.current.confirmFound({ receiverName: 'Ana' });
    });

    expect(result.current.isFoundFormOpen).toBe(true);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Não foi possível salvar',
      'Tente novamente em alguns instantes.'
    );
  });

  it('deve definir o usuário atual como null quando não houver sessão', async () => {
    postService.getPosts.mockResolvedValueOnce([]);
    sessionService.getCurrentUser.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useFeed());
    await act(async () => {});

    expect(result.current.currentUser).toBeNull();
  });

  it('deve carregar a foto do perfil e limpar quando não houver', async () => {
    postService.getPosts.mockResolvedValue([]);
    profileService.getProfile.mockResolvedValueOnce({
      name: 'Irlam',
      photoUri: 'file:///docs/profile-photo-1.jpg',
    });

    const { result } = renderHook(() => useFeed());
    await act(async () => {});
    expect(result.current.userPhoto).toBe('file:///docs/profile-photo-1.jpg');

    profileService.getProfile.mockRejectedValueOnce(new Error('x'));
    const second = renderHook(() => useFeed());
    await act(async () => {});
    expect(second.result.current.userPhoto).toBeNull();
  });
});
