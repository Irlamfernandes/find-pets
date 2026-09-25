import { renderHook, act } from '@testing-library/react-native';
import { useFeed } from '../useFeed';
import { postService } from '../../services/postService';
import { locationService } from '../../services/locationService';
import { onboardingService } from '../../services/onboarding';
import { Alert } from 'react-native';

let mockCameraPermissionValue = { granted: true };
let mockRequestPermissionResult = { granted: true };

jest.mock('../../services/postService', () => ({
  postService: {
    getPosts: jest.fn(),
    savePost: jest.fn(),
    deletePost: jest.fn(),
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
      })
    );
    expect(result.current.isCameraOpen).toBe(false);
  });

  it('deve tirar a foto e salvar o post sem WhatsApp se o perfil não o possuir', async () => {
    postService.getPosts.mockResolvedValue([]);
    postService.savePost.mockResolvedValueOnce();
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
    const mockPosts = [{ id: '1', type: 'Perdido' }];
    postService.getPosts.mockResolvedValueOnce(mockPosts);

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

  it('deve excluir um post com sucesso ao confirmar no alerta', async () => {
    const mockPosts = [{ id: '1', type: 'Perdido' }];
    postService.getPosts.mockResolvedValueOnce(mockPosts);

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
      deleteButton.onPress();
    });

    expect(result.current.posts).toEqual([]);
  });
});
