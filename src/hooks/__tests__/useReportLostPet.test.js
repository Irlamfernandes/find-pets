import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useReportLostPet, MAX_PHOTOS } from '../useReportLostPet';
import { postService } from '../../services/postService';
import { photoService } from '../../services/photoService';
import { locationService } from '../../services/locationService';
import { onboardingService } from '../../services/onboarding';
import { sessionService } from '../../services/session';

jest.mock('../../services/postService', () => ({
  postService: { savePost: jest.fn() },
}));

jest.mock('../../services/photoService', () => ({
  photoService: { pickFromGallery: jest.fn(), takePhoto: jest.fn() },
}));

jest.mock('../../services/locationService', () => ({
  locationService: {
    getCurrentLocation: jest.fn(),
    getAddressFromCoords: jest.fn(),
    getCoordsFromAddress: jest.fn(),
  },
}));

jest.mock('../../services/onboarding', () => ({
  onboardingService: { getUserProfile: jest.fn() },
}));

jest.mock('../../services/session', () => ({
  sessionService: { getSession: jest.fn() },
}));

jest.spyOn(Alert, 'alert');

const photo = (uri, exif) => ({ uri, exif });

async function setupWithPhotos(photos, onSaved = jest.fn()) {
  photoService.pickFromGallery.mockResolvedValueOnce({
    photos,
    denied: false,
  });
  const hook = renderHook(() => useReportLostPet(onSaved));
  await act(async () => {
    await hook.result.current.pickFromGallery();
  });
  act(() => hook.result.current.setDescription('  Gato preto  '));
  return hook;
}

describe('useReportLostPet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ now: new Date(2026, 8, 25, 18, 0) });
    postService.savePost.mockResolvedValue([]);
    onboardingService.getUserProfile.mockResolvedValue({
      whatsapp: '5511999999999',
    });
    sessionService.getSession.mockResolvedValue({ usuario: 'user@test.com' });
    locationService.getCoordsFromAddress.mockResolvedValue(null);
    locationService.getAddressFromCoords.mockResolvedValue('Rua da Foto, 1');
    locationService.getCurrentLocation.mockResolvedValue({
      latitude: -10,
      longitude: -20,
      address: 'Lat',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve adicionar fotos da galeria e da câmera respeitando o limite', async () => {
    const { result } = renderHook(() => useReportLostPet());

    photoService.pickFromGallery.mockResolvedValueOnce({
      photos: [photo('1'), photo('2'), photo('3'), photo('4')],
      denied: false,
    });
    await act(async () => {
      await result.current.pickFromGallery();
    });
    expect(photoService.pickFromGallery).toHaveBeenCalledWith(MAX_PHOTOS);
    expect(result.current.remainingPhotos).toBe(1);

    photoService.takePhoto.mockResolvedValueOnce({
      photos: [photo('5'), photo('6')],
      denied: false,
    });
    await act(async () => {
      await result.current.takePhoto();
    });
    expect(result.current.photos.map((p) => p.uri)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
    ]);

    await act(async () => {
      await result.current.pickFromGallery();
    });
    expect(Alert.alert).toHaveBeenCalledWith(
      'Limite de fotos',
      `Você pode adicionar até ${MAX_PHOTOS} fotos.`
    );

    act(() => result.current.removePhoto('3'));
    expect(result.current.photos.map((p) => p.uri)).toEqual([
      '1',
      '2',
      '4',
      '5',
    ]);
  });

  it('deve avisar quando a permissão for negada ou ocorrer erro', async () => {
    const { result } = renderHook(() => useReportLostPet());

    photoService.takePhoto.mockResolvedValueOnce({ photos: [], denied: true });
    await act(async () => {
      await result.current.takePhoto();
    });
    expect(Alert.alert).toHaveBeenCalledWith(
      'Permissão necessária',
      'Permita o acesso à câmera para fotografar o seu pet.'
    );

    photoService.pickFromGallery.mockResolvedValueOnce({
      photos: [],
      denied: true,
    });
    await act(async () => {
      await result.current.pickFromGallery();
    });
    expect(Alert.alert).toHaveBeenCalledWith(
      'Permissão necessária',
      'Permita o acesso às fotos para anexar imagens do seu pet.'
    );

    photoService.takePhoto.mockRejectedValueOnce(new Error('falha'));
    await act(async () => {
      await result.current.takePhoto();
    });
    expect(Alert.alert).toHaveBeenCalledWith(
      'Não foi possível adicionar',
      'Tente adicionar a foto novamente.'
    );
    expect(result.current.photos).toEqual([]);
  });

  it('deve exigir foto e descrição antes de salvar', async () => {
    const { result } = renderHook(() => useReportLostPet());

    await act(async () => {
      await result.current.submit();
    });
    expect(Alert.alert).toHaveBeenCalledWith(
      'Adicione uma foto',
      'Inclua pelo menos uma foto do pet para ajudar a encontrá-lo.'
    );

    photoService.pickFromGallery.mockResolvedValueOnce({
      photos: [photo('1')],
      denied: false,
    });
    await act(async () => {
      await result.current.pickFromGallery();
    });
    await act(async () => {
      await result.current.submit();
    });
    expect(Alert.alert).toHaveBeenCalledWith(
      'Descreva o pet',
      'Conte como ele é e onde foi visto pela última vez (cor, porte, nome...).'
    );
    expect(postService.savePost).not.toHaveBeenCalled();
  });

  it('deve salvar usando o GPS e a data da foto', async () => {
    const onSaved = jest.fn();
    const { result } = await setupWithPhotos(
      [
        photo('a.jpg', {
          GPSLatitude: 23.5,
          GPSLatitudeRef: 'S',
          GPSLongitude: 46.6,
          GPSLongitudeRef: 'W',
          DateTimeOriginal: '2026:09:24 09:15:00',
        }),
        photo('b.jpg'),
      ],
      onSaved
    );

    await act(async () => {
      await result.current.submit();
    });

    const occurredAt = new Date(2026, 8, 24, 9, 15);
    expect(postService.savePost).toHaveBeenCalledWith({
      id: String(new Date(2026, 8, 25, 18, 0).getTime()),
      author: 'user@test.com',
      images: ['a.jpg', 'b.jpg'],
      imageUri: 'a.jpg',
      description: 'Gato preto',
      latitude: -23.5,
      longitude: -46.6,
      location: 'Rua da Foto, 1',
      occurredAt: occurredAt.toISOString(),
      date: '24/09/2026',
      type: 'Perdido',
      status: 'Perdido',
      contactPhone: '5511999999999',
    });
    expect(locationService.getCoordsFromAddress).not.toHaveBeenCalled();
    expect(locationService.getCurrentLocation).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      'Desaparecimento registrado',
      'O registro já aparece na lista de pets perdidos.'
    );
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(result.current.isSaving).toBe(false);
  });

  it('deve usar o endereço digitado quando a foto não tiver GPS', async () => {
    locationService.getCoordsFromAddress.mockResolvedValueOnce({
      latitude: 1,
      longitude: 2,
    });
    onboardingService.getUserProfile.mockResolvedValueOnce(null);
    sessionService.getSession.mockResolvedValueOnce(null);
    const { result } = await setupWithPhotos([photo('a.jpg')]);
    act(() => result.current.setAddress('  Rua Digitada, 5  '));

    await act(async () => {
      await result.current.submit();
    });

    expect(locationService.getCoordsFromAddress).toHaveBeenCalledWith(
      'Rua Digitada, 5'
    );
    expect(locationService.getAddressFromCoords).not.toHaveBeenCalled();
    expect(postService.savePost).toHaveBeenCalledWith(
      expect.objectContaining({
        author: null,
        contactPhone: null,
        latitude: 1,
        longitude: 2,
        location: 'Rua Digitada, 5',
        occurredAt: new Date(2026, 8, 25, 18, 0).toISOString(),
      })
    );
  });

  it('deve usar a localização atual e coordenadas como texto quando não houver endereço', async () => {
    locationService.getAddressFromCoords.mockResolvedValueOnce(null);
    const { result } = await setupWithPhotos([photo('a.jpg')]);

    await act(async () => {
      await result.current.submit();
    });

    expect(postService.savePost).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: -10,
        longitude: -20,
        location: 'Lat: -10.0000, Lon: -20.0000',
      })
    );
  });

  it('deve salvar sem coordenadas quando nenhuma localização estiver disponível', async () => {
    locationService.getCurrentLocation.mockResolvedValueOnce({
      latitude: null,
      longitude: null,
      address: 'Localização não permitida',
    });
    const { result } = await setupWithPhotos([photo('a.jpg')]);

    await act(async () => {
      await result.current.submit();
    });

    expect(postService.savePost).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: null,
        longitude: null,
        location: 'Localização não informada',
      })
    );
  });

  it('deve avisar quando falhar ao salvar e não salvar em duplicidade', async () => {
    let rejectSave;
    postService.savePost.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectSave = reject;
        })
    );
    const onSaved = jest.fn();
    const { result } = await setupWithPhotos([photo('a.jpg')], onSaved);

    let firstSubmit;
    await act(async () => {
      firstSubmit = result.current.submit();
    });
    expect(result.current.isSaving).toBe(true);

    await act(async () => {
      await result.current.submit();
    });
    expect(postService.savePost).toHaveBeenCalledTimes(1);

    await act(async () => {
      rejectSave(new Error('falha'));
      await firstSubmit;
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Não foi possível registrar',
      'Tente salvar o registro novamente.'
    );
    expect(onSaved).not.toHaveBeenCalled();
    expect(result.current.isSaving).toBe(false);
  });
});
