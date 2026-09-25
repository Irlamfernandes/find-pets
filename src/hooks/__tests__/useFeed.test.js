import { renderHook, act } from '@testing-library/react-native';
import { useFeed } from '../useFeed';
import { postService } from '../../services/postService';
import { locationService } from '../../services/locationService';
import { onboardingService } from '../../services/onboarding';
import { sessionService } from '../../services/session';
import { Alert } from 'react-native';

let mockCameraPermissionValue = { granted: true };
let mockRequestPermissionResult = { granted: true };

jest.mock('../../services/postService', () => ({
  postService: {
    getPosts: jest.fn(),
    savePost: jest.fn(),
    deletePost: jest.fn(),
    updatePostStatus: jest.fn(),
  },
}));

jest.mock('../../services/locationService', () => ({
  locationService: {
    getCurrentLocation: jest.fn(),
  },
}));

jest.mock('../../services/onboarding', () => ({
  onboardingService: {
    getUserProfile: jest.fn(),
  },
}));

jest.mock('../../services/session', () => ({
  sessionService: {
    getSession: jest.fn().mockResolvedValue({ usuario: 'user1@test.com' }),
  },
}));

jest.mock('expo-camera', () => ({
  useCameraPermissions: () => [
    mockCameraPermissionValue,
    jest.fn().mockImplementation(async () => mockRequestPermissionResult),
  ],
}));

jest.spyOn(Alert, 'alert');

describe('useFeed Hook - 100% Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCameraPermissionValue = { granted: true };
    mockRequestPermissionResult = { granted: true };
    onboardingService.getUserProfile.mockResolvedValue({
      name: 'Irlam',
      whatsapp: '11999999999',
    });
    sessionService.getSession.mockResolvedValue({ usuario: 'user1@test.com' });
    locationService.getCurrentLocation.mockResolvedValue({
      latitude: -22.5,
      longitude: -44.1,
      address: 'Lat: -22.5000, Lon: -44.1000',
    });
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
    onboardingService.getUserProfile.mockRejectedValueOnce(
      new Error('Erro perfil')
    );
    sessionService.getSession.mockRejectedValueOnce(new Error('Erro sessão'));

    const { result } = renderHook(() => useFeed());

    await act(async () => {});

    expect(result.current.posts).toEqual([]);
    expect(result.current.userName).toBe('');
  });

  it('deve lidar com perfil sem nome ou nulo graciosamente', async () => {
    postService.getPosts.mockResolvedValueOnce([]);
    onboardingService.getUserProfile.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useFeed());

    await act(async () => {});

    expect(result.current.userName).toBe('');
  });

  it('deve abrir a câmera diretamente se a permissão já estiver concedida', async () => {
    mockCameraPermissionValue = { granted: true };
    postService.getPosts.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useFeed());
    await act(async () => {});

    await act(async () => {
      await result.current.openCamera();
    });

    expect(result.current.isCameraOpen).toBe(true);
  });

  it('deve solicitar permissão e abrir se o usuário aceitar no prompt', async () => {
    mockCameraPermissionValue = { granted: false };
    mockRequestPermissionResult = { granted: true };
    postService.getPosts.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useFeed());
    await act(async () => {});

    await act(async () => {
      await result.current.openCamera();
    });

    expect(result.current.isCameraOpen).toBe(true);
  });

  it('deve solicitar permissão e não abrir se o usuário negar no prompt', async () => {
    mockCameraPermissionValue = { granted: false };
    mockRequestPermissionResult = { granted: false };
    postService.getPosts.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useFeed());
    await act(async () => {});

    await act(async () => {
      await result.current.openCamera();
    });

    expect(result.current.isCameraOpen).toBe(false);
  });

  it('deve fechar a câmera corretamente', async () => {
    postService.getPosts.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useFeed());
    await act(async () => {});

    await act(async () => {
      await result.current.openCamera();
    });
    expect(result.current.isCameraOpen).toBe(true);

    act(() => {
      result.current.closeCamera();
    });
    expect(result.current.isCameraOpen).toBe(false);
  });

  it('não deve tirar foto se a referência da câmera for nula', async () => {
    postService.getPosts.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useFeed());
    await act(async () => {});

    await act(async () => {
      await result.current.takePicture();
    });

    expect(postService.savePost).not.toHaveBeenCalled();
  });

  it('deve tirar a foto e salvar o post com sucesso incluindo o WhatsApp', async () => {
    postService.getPosts.mockResolvedValue([]);
    postService.savePost.mockResolvedValueOnce();
    onboardingService.getUserProfile.mockResolvedValue({
      name: 'Irlam',
      whatsapp: '11999999999',
    });

    const { result } = renderHook(() => useFeed());
    await act(async () => {});

    const mockCamera = {
      takePictureAsync: jest
        .fn()
        .mockResolvedValue({ uri: 'file://photo.jpg' }),
    };

    act(() => {
      result.current.setCameraRef(mockCamera);
    });

    await act(async () => {
      await result.current.openCamera();
      await result.current.takePicture();
    });

    expect(postService.savePost).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUri: 'file://photo.jpg',
        contactPhone: '11999999999',
        author: 'user1@test.com',
      })
    );
    expect(result.current.isCameraOpen).toBe(false);
  });

  it('deve tirar a foto e salvar o post sem WhatsApp se o perfil não o possuir', async () => {
    postService.getPosts.mockResolvedValue([]);
    postService.savePost.mockResolvedValueOnce();
    sessionService.getSession.mockResolvedValue(null);
    onboardingService.getUserProfile.mockResolvedValue({
      name: 'Irlam',
      whatsapp: null,
    });

    const { result } = renderHook(() => useFeed());
    await act(async () => {});

    const mockCamera = {
      takePictureAsync: jest
        .fn()
        .mockResolvedValue({ uri: 'file://photo.jpg' }),
    };

    act(() => {
      result.current.setCameraRef(mockCamera);
    });

    await act(async () => {
      await result.current.openCamera();
      await result.current.takePicture();
    });

    expect(postService.savePost).toHaveBeenCalledWith(
      expect.objectContaining({
        contactPhone: null,
        author: null,
      })
    );
  });

  it('deve disparar alerta de erro se falhar ao tirar a foto ou salvar', async () => {
    postService.getPosts.mockResolvedValue([]);

    const { result } = renderHook(() => useFeed());
    await act(async () => {});

    const mockCamera = {
      takePictureAsync: jest
        .fn()
        .mockRejectedValueOnce(new Error('Falha câmera')),
    };

    act(() => {
      result.current.setCameraRef(mockCamera);
    });

    await act(async () => {
      await result.current.openCamera();
      await result.current.takePicture();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Erro',
      'Não foi possível capturar a foto ou obter a localização. Tente novamente.'
    );
    expect(result.current.isCameraOpen).toBe(false);
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
      'Erro',
      'Não foi possível excluir a publicação. Tente novamente.'
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

  it('deve marcar como encontrado e manter o post no feed', async () => {
    const mockPosts = [{ id: '1', type: 'Perdido', author: 'user1@test.com' }];
    const updatedPosts = [{ ...mockPosts[0], status: 'Encontrado' }];
    postService.getPosts.mockResolvedValueOnce(mockPosts);
    postService.updatePostStatus.mockResolvedValueOnce(updatedPosts);

    const { result } = renderHook(() => useFeed());
    await act(async () => {});
    await act(async () => {
      await result.current.markPostAsFound('1');
    });

    const alertCall = Alert.alert.mock.calls.find(
      (call) => call[0] === 'Confirmar finalização'
    );
    const finishButton = alertCall[2].find((btn) => btn.text === 'Finalizado');

    await act(async () => {
      await finishButton.onPress();
    });

    expect(postService.updatePostStatus).toHaveBeenCalledWith(
      '1',
      'Encontrado'
    );
    expect(result.current.posts).toEqual(updatedPosts);
  });

  it('não deve finalizar post de outro usuário ou já encontrado', async () => {
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
    await act(async () => {
      await result.current.markPostAsFound('1');
      await result.current.markPostAsFound('2');
    });

    expect(postService.updatePostStatus).not.toHaveBeenCalled();
  });

  it('deve exibir erro quando a finalização persistida falhar', async () => {
    const mockPosts = [{ id: '1', type: 'Perdido', author: 'user1@test.com' }];
    postService.getPosts.mockResolvedValueOnce(mockPosts);
    postService.updatePostStatus.mockRejectedValueOnce(
      new Error('Erro storage')
    );

    const { result } = renderHook(() => useFeed());
    await act(async () => {});
    await act(async () => {
      await result.current.markPostAsFound('1');
    });

    const alertCall = Alert.alert.mock.calls.find(
      (call) => call[0] === 'Confirmar finalização'
    );
    const finishButton = alertCall[2].find((btn) => btn.text === 'Finalizado');
    await act(async () => {
      await finishButton.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Erro',
      'Não foi possível finalizar a publicação. Tente novamente.'
    );
  });
});
