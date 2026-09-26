import * as ImagePicker from 'expo-image-picker';
import { photoService } from '../photoService';

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}));

describe('photoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve selecionar várias fotos da galeria com EXIF', async () => {
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({
      granted: true,
    });
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [
        { uri: 'a.jpg', exif: { GPSLatitude: 1 }, width: 10 },
        { uri: 'b.jpg' },
      ],
    });

    const result = await photoService.pickFromGallery(3);

    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith({
      mediaTypes: ['images'],
      quality: 0.5,
      exif: true,
      allowsMultipleSelection: true,
      selectionLimit: 3,
    });
    expect(result).toEqual({
      photos: [
        { uri: 'a.jpg', exif: { GPSLatitude: 1 } },
        { uri: 'b.jpg', exif: undefined },
      ],
      denied: false,
    });
  });

  it('deve informar quando a permissão da galeria for negada', async () => {
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({
      granted: false,
    });

    const result = await photoService.pickFromGallery(5);

    expect(result).toEqual({ photos: [], denied: true });
    expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
  });

  it('deve tirar uma foto com a câmera', async () => {
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValueOnce({
      granted: true,
    });
    ImagePicker.launchCameraAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'cam.jpg', exif: {} }],
    });

    const result = await photoService.takePhoto();

    expect(ImagePicker.launchCameraAsync).toHaveBeenCalledWith({
      mediaTypes: ['images'],
      quality: 0.5,
      exif: true,
    });
    expect(result).toEqual({
      photos: [{ uri: 'cam.jpg', exif: {} }],
      denied: false,
    });
  });

  it('deve retornar lista vazia se o usuário cancelar', async () => {
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValueOnce({
      granted: true,
    });
    ImagePicker.launchCameraAsync.mockResolvedValueOnce({
      canceled: true,
      assets: null,
    });

    expect(await photoService.takePhoto()).toEqual({
      photos: [],
      denied: false,
    });
  });

  it('deve informar quando a permissão da câmera for negada', async () => {
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValueOnce({
      granted: false,
    });

    expect(await photoService.takePhoto()).toEqual({
      photos: [],
      denied: true,
    });
  });

  describe('pickProfilePhoto', () => {
    const profileOptions = {
      mediaTypes: ['images'],
      quality: 0.6,
      allowsEditing: true,
      aspect: [1, 1],
    };

    it('deve tirar a foto de perfil com recorte quadrado', async () => {
      ImagePicker.requestCameraPermissionsAsync.mockResolvedValueOnce({
        granted: true,
      });
      ImagePicker.launchCameraAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'avatar.jpg' }],
      });

      await expect(photoService.pickProfilePhoto('camera')).resolves.toEqual({
        uri: 'avatar.jpg',
        denied: false,
      });
      expect(ImagePicker.launchCameraAsync).toHaveBeenCalledWith(
        profileOptions
      );
    });

    it('deve escolher a foto de perfil na galeria ou retornar null ao cancelar', async () => {
      ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({
        granted: true,
      });
      ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
        canceled: true,
        assets: null,
      });

      await expect(photoService.pickProfilePhoto('gallery')).resolves.toEqual({
        uri: null,
        denied: false,
      });
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
        profileOptions
      );
    });

    it('deve informar quando a permissão for negada', async () => {
      ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({
        granted: false,
      });

      await expect(photoService.pickProfilePhoto('gallery')).resolves.toEqual({
        uri: null,
        denied: true,
      });
    });
  });
});
