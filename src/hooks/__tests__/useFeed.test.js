import { renderHook, act } from '@testing-library/react-native';
import { useFeed } from '../useFeed';
import { postService } from '../../services/postService';
import { locationService } from '../../services/locationService';
import { onboardingService } from '../../services/onboarding';

let mockCameraPermissionValue = { granted: true };
let mockRequestPermissionResult = { granted: true };

jest.mock('../../services/postService', () => ({
  postService: {
    getPosts: jest.fn(),
    savePost: jest.fn(),
  },
}));

jest.mock('../../services/locationService', () => ({
  locationService: {
    getCurrentLocation: jest.fn(),
  },
}));

jest.mock('../../services/onboarding', () => ({
  onboardingService: {
    getUserProfile: jest
      .fn()
      .mockResolvedValue({ name: 'Irlam', whatsapp: '11999999999' }),
  },
}));

jest.mock('expo-camera', () => ({
  useCameraPermissions: () => [
    mockCameraPermissionValue,
    jest.fn().mockImplementation(async () => mockRequestPermissionResult),
  ],
}));

describe('useFeed Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCameraPermissionValue = { granted: true };
    mockRequestPermissionResult = { granted: true };
    locationService.getCurrentLocation.mockResolvedValue({
      latitude: -22.5,
      longitude: -44.1,
      address: 'Lat: -22.5000, Lon: -44.1000',
    });
  });

  it('deve carregar os posts ao iniciar', async () => {
    const mockPosts = [{ id: '1', type: 'Perdido' }];
    postService.getPosts.mockResolvedValueOnce(mockPosts);

    const { result } = renderHook(() => useFeed());

    await act(async () => {});

    expect(result.current.posts).toEqual(mockPosts);
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

  it('deve solicitar permissão e abortar se o usuário negar no prompt', async () => {
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

  it('deve solicitar permissão e abrir se o usuário aceitar no prompt', async () => {
    mockCameraPermissionValue = null;
    mockRequestPermissionResult = { granted: true };
    postService.getPosts.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useFeed());
    await act(async () => {});

    await act(async () => {
      await result.current.openCamera();
    });

    expect(result.current.isCameraOpen).toBe(true);
  });

  it('deve abrir e fechar a câmera corretamente quando permitida', async () => {
    postService.getPosts.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useFeed());
    await act(async () => {});

    expect(result.current.isCameraOpen).toBe(false);

    await act(async () => {
      await result.current.openCamera();
    });

    expect(result.current.isCameraOpen).toBe(true);

    act(() => {
      result.current.closeCamera();
    });

    expect(result.current.isCameraOpen).toBe(false);
  });

  it('deve tirar a foto e salvar o post com sucesso incluindo o WhatsApp do usuário', async () => {
    postService.getPosts.mockResolvedValue([]);
    postService.savePost.mockResolvedValueOnce();

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

    expect(mockCamera.takePictureAsync).toHaveBeenCalled();
    expect(locationService.getCurrentLocation).toHaveBeenCalled();
    expect(onboardingService.getUserProfile).toHaveBeenCalled();
    expect(postService.savePost).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUri: 'file://photo.jpg',
        latitude: -22.5,
        longitude: -44.1,
        location: 'Lat: -22.5000, Lon: -44.1000',
        type: 'Perdido',
        contactPhone: '11999999999',
      })
    );
    expect(result.current.isCameraOpen).toBe(false);
  });

  it('deve lidar com erro ao tirar a foto', async () => {
    postService.getPosts.mockResolvedValue([]);

    const { result } = renderHook(() => useFeed());
    await act(async () => {});

    const mockCamera = {
      takePictureAsync: jest
        .fn()
        .mockRejectedValueOnce(new Error('Erro câmera')),
    };

    act(() => {
      result.current.setCameraRef(mockCamera);
    });

    await act(async () => {
      await result.current.openCamera();
      await result.current.takePicture();
    });

    expect(mockCamera.takePictureAsync).toHaveBeenCalled();
  });

  it('não deve fazer nada ao tentar tirar foto se a referência da câmera for nula', async () => {
    postService.getPosts.mockResolvedValue([]);

    const { result } = renderHook(() => useFeed());
    await act(async () => {});

    await act(async () => {
      await result.current.takePicture();
    });

    expect(postService.savePost).not.toHaveBeenCalled();
  });

  it('deve tirar a foto e salvar o post sem WhatsApp se o perfil não o possuir', async () => {
    postService.getPosts.mockResolvedValue([]);
    postService.savePost.mockResolvedValueOnce();
    onboardingService.getUserProfile.mockResolvedValueOnce({
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
});
