import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useReportLostPet, MAX_PHOTOS } from '../useReportLostPet';
import { postService } from '../../services/postService';
import { photoService } from '../../../../shared/services/photoService';
import { postPhotoStorage } from '../../../../shared/services/photoStorage';
import { locationService } from '../../../../shared/services/locationService';
import { profileService } from '../../../profile/services/profileService';
import { sessionService } from '../../../auth/services/sessionService';

jest.mock('../../services/postService', () => ({
  postService: { savePost: jest.fn(), updatePost: jest.fn() },
}));

jest.mock('../../../../shared/services/photoService', () => ({
  photoService: { pickFromGallery: jest.fn(), takePhoto: jest.fn() },
}));

jest.mock('../../../../shared/services/photoStorage', () => ({
  postPhotoStorage: { persistAll: jest.fn(), removeAll: jest.fn() },
}));

jest.mock('../../../../shared/services/locationService', () => ({
  locationService: {
    getCurrentLocation: jest.fn(),
    getAddressFromCoords: jest.fn(),
    getCoordsFromAddress: jest.fn(),
  },
}));

jest.mock('../../../profile/services/profileService', () => ({
  profileService: { getProfile: jest.fn() },
}));

jest.mock('../../../auth/services/sessionService', () => ({
  sessionService: { getCurrentUser: jest.fn() },
}));

jest.spyOn(Alert, 'alert');

const photo = (uri, exif) => ({ uri, exif });

const NOW = new Date(2026, 8, 25, 18, 0);

const emptyPetData = {
  petName: '',
  species: '',
  size: '',
  sex: '',
  color: '',
  breed: '',
  description: '',
};

// Renderiza o formulário já com fotos e espécie escolhidas
async function setupWithPhotos(photos, onSaved = jest.fn()) {
  photoService.pickFromGallery.mockResolvedValueOnce({
    photos,
    denied: false,
  });
  const hook = renderHook(() => useReportLostPet(onSaved));
  await act(async () => {
    await hook.result.current.pickFromGallery();
  });
  act(() => hook.result.current.setPetField('species', 'Gato'));
  return hook;
}

describe('useReportLostPet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ now: NOW });
    postService.savePost.mockResolvedValue([]);
    postService.updatePost.mockResolvedValue([]);
    // Simula a cópia para a pasta permanente
    postPhotoStorage.persistAll.mockImplementation(async (uris) =>
      uris.map((uri) => (uri.startsWith('stored:') ? uri : `stored:${uri}`))
    );
    profileService.getProfile.mockResolvedValue({
      whatsapp: '5511999999999',
    });
    sessionService.getCurrentUser.mockResolvedValue('user@test.com');
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

  it('deve salvar uma única vez mesmo com chamadas simultâneas', async () => {
    const { result } = await setupWithPhotos([photo('file:///a.jpg')]);

    await act(async () => {
      await Promise.all([result.current.submit(), result.current.submit()]);
    });

    expect(postService.savePost).toHaveBeenCalledTimes(1);
  });

  it('deve começar vazio para um registro novo', () => {
    const { result } = renderHook(() => useReportLostPet());

    expect(result.current.isEditing).toBe(false);
    expect(result.current.photos).toEqual([]);
    expect(result.current.petData).toEqual(emptyPetData);
    expect(result.current.address).toBe('');
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

  it('deve registrar o local no momento em que a foto é tirada pelo app', async () => {
    photoService.takePhoto.mockResolvedValueOnce({
      photos: [photo('cam.jpg', { DateTimeOriginal: '2026:09:25 10:00:00' })],
      denied: false,
    });
    locationService.getCurrentLocation.mockResolvedValueOnce({
      latitude: -7,
      longitude: -8,
      address: 'Lat',
    });
    const { result } = renderHook(() => useReportLostPet());

    await act(async () => {
      await result.current.takePhoto();
    });
    expect(result.current.photos[0].coords).toEqual({
      latitude: -7,
      longitude: -8,
    });

    act(() => result.current.setPetField('species', 'Cachorro'));
    // Ao salvar mais tarde (em outro lugar), vale o local da foto e a
    // localização do momento do salvamento nem é consultada
    await act(async () => {
      await result.current.submit();
    });

    expect(postService.savePost).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: -7, longitude: -8 })
    );
    expect(locationService.getCurrentLocation).toHaveBeenCalledTimes(1);
  });

  it('deve manter a foto da câmera sem local quando a localização não estiver disponível', async () => {
    photoService.takePhoto.mockResolvedValueOnce({
      photos: [photo('cam.jpg')],
      denied: false,
    });
    locationService.getCurrentLocation.mockResolvedValueOnce({
      latitude: null,
      longitude: null,
      address: 'Localização não permitida',
    });
    const { result } = renderHook(() => useReportLostPet());

    await act(async () => {
      await result.current.takePhoto();
    });

    expect(result.current.photos).toEqual([photo('cam.jpg')]);
  });

  it('não deve buscar a localização se a câmera for cancelada', async () => {
    photoService.takePhoto.mockResolvedValueOnce({ photos: [], denied: false });
    const { result } = renderHook(() => useReportLostPet());

    await act(async () => {
      await result.current.takePhoto();
    });

    expect(locationService.getCurrentLocation).not.toHaveBeenCalled();
    expect(result.current.photos).toEqual([]);
  });

  it('deve exigir foto e espécie antes de salvar', async () => {
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
      'Escolha a espécie',
      'Informe se o pet é cachorro, gato ou outro animal.'
    );
    expect(postService.savePost).not.toHaveBeenCalled();
  });

  it('deve salvar os dados do pet, o GPS e a data da foto e copiar as fotos', async () => {
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
    act(() => {
      result.current.setPetField('petName', '  Mimi ');
      result.current.setPetField('size', 'Pequeno');
      result.current.setPetField('sex', 'Fêmea');
      result.current.setPetField('color', 'Preta');
      result.current.setPetField('breed', 'Siamês');
      result.current.setPetField('description', ' Coleira rosa ');
    });

    await act(async () => {
      await result.current.submit();
    });

    const occurredAt = new Date(2026, 8, 24, 9, 15);
    expect(postPhotoStorage.persistAll).toHaveBeenCalledWith([
      'a.jpg',
      'b.jpg',
    ]);
    expect(postService.savePost).toHaveBeenCalledWith({
      id: String(NOW.getTime()),
      author: 'user@test.com',
      images: ['stored:a.jpg', 'stored:b.jpg'],
      imageUri: 'stored:a.jpg',
      petName: 'Mimi',
      species: 'Gato',
      size: 'Pequeno',
      sex: 'Fêmea',
      color: 'Preta',
      breed: 'Siamês',
      description: 'Coleira rosa',
      latitude: -23.5,
      longitude: -46.6,
      location: 'Rua da Foto, 1',
      occurredAt: occurredAt.toISOString(),
      occurredZone: { offsetMinutes: -180, abbreviation: 'BRT' },
      date: '24/09/2026',
      type: 'Perdido',
      status: 'Perdido',
      contactPhone: '5511999999999',
    });
    expect(locationService.getCoordsFromAddress).not.toHaveBeenCalled();
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
    profileService.getProfile.mockResolvedValueOnce(null);
    sessionService.getCurrentUser.mockResolvedValueOnce(null);
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
        occurredAt: NOW.toISOString(),
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

    // A segunda chamada recebe o mesmo salvamento em andamento
    let secondSubmit;
    act(() => {
      secondSubmit = result.current.submit();
    });
    expect(postService.savePost).toHaveBeenCalledTimes(1);

    await act(async () => {
      rejectSave(new Error('falha'));
      await Promise.all([firstSubmit, secondSubmit]);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Não foi possível registrar',
      'Tente salvar o registro novamente.'
    );
    expect(onSaved).not.toHaveBeenCalled();
    expect(result.current.isSaving).toBe(false);
  });

  describe('edição de um registro', () => {
    const existingPost = {
      id: '42',
      author: 'user@test.com',
      images: ['stored:a.jpg', 'stored:b.jpg'],
      imageUri: 'stored:a.jpg',
      petName: 'Rex',
      species: 'Cachorro',
      size: 'Médio',
      color: 'Caramelo',
      latitude: -23,
      longitude: -46,
      location: 'Rua Antiga, 10',
      occurredAt: '2026-09-20T12:00:00.000Z',
      status: 'Perdido',
    };

    const renderEdit = (post = existingPost, onSaved = jest.fn()) =>
      renderHook(() => useReportLostPet(onSaved, post));

    it('deve abrir preenchido com os dados do registro', () => {
      const { result } = renderEdit();

      expect(result.current.isEditing).toBe(true);
      expect(result.current.photos).toEqual([
        { uri: 'stored:a.jpg' },
        { uri: 'stored:b.jpg' },
      ]);
      expect(result.current.petData).toEqual({
        ...emptyPetData,
        petName: 'Rex',
        species: 'Cachorro',
        size: 'Médio',
        color: 'Caramelo',
      });
      expect(result.current.address).toBe('Rua Antiga, 10');
    });

    it('deve atualizar os dados mantendo o local e apagar as fotos removidas', async () => {
      const onSaved = jest.fn();
      const { result } = renderEdit(existingPost, onSaved);

      act(() => {
        result.current.setPetField('petName', 'Rex Jr');
        result.current.removePhoto('stored:a.jpg');
      });
      photoService.takePhoto.mockResolvedValueOnce({
        photos: [photo('nova.jpg')],
        denied: false,
      });
      await act(async () => {
        await result.current.takePhoto();
      });

      await act(async () => {
        await result.current.submit();
      });

      expect(postService.updatePost).toHaveBeenCalledWith('42', {
        images: ['stored:b.jpg', 'stored:nova.jpg'],
        imageUri: 'stored:b.jpg',
        ...emptyPetData,
        petName: 'Rex Jr',
        species: 'Cachorro',
        size: 'Médio',
        color: 'Caramelo',
        latitude: -23,
        longitude: -46,
        location: 'Rua Antiga, 10',
      });
      expect(postPhotoStorage.removeAll).toHaveBeenCalledWith(['stored:a.jpg']);
      expect(postService.savePost).not.toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Registro atualizado',
        'As alterações já aparecem na lista de pets perdidos.'
      );
      expect(onSaved).toHaveBeenCalledTimes(1);
    });

    it('deve recalcular o ponto do mapa quando o endereço mudar', async () => {
      locationService.getCoordsFromAddress.mockResolvedValueOnce({
        latitude: 5,
        longitude: 6,
      });
      const { result } = renderEdit();
      act(() => result.current.setAddress('Rua Nova, 20'));

      await act(async () => {
        await result.current.submit();
      });

      expect(postService.updatePost).toHaveBeenCalledWith(
        '42',
        expect.objectContaining({
          latitude: 5,
          longitude: 6,
          location: 'Rua Nova, 20',
        })
      );
    });

    it('deve manter as coordenadas se o endereço novo não for encontrado', async () => {
      const { result } = renderEdit();
      act(() => result.current.setAddress('Lugar desconhecido'));

      await act(async () => {
        await result.current.submit();
      });

      expect(postService.updatePost).toHaveBeenCalledWith(
        '42',
        expect.objectContaining({
          latitude: -23,
          longitude: -46,
          location: 'Lugar desconhecido',
        })
      );
    });

    it('deve manter o local original com endereço vazio e aceitar registro antigo', async () => {
      const legacyPost = {
        id: '7',
        imageUri: 'file:///antiga.jpg',
        description: 'Cachorro preto',
        species: 'Cachorro',
        location: 'Centro',
      };
      const { result } = renderEdit(legacyPost);
      expect(result.current.photos).toEqual([{ uri: 'file:///antiga.jpg' }]);
      act(() => result.current.setAddress('   '));

      await act(async () => {
        await result.current.submit();
      });

      expect(postService.updatePost).toHaveBeenCalledWith(
        '7',
        expect.objectContaining({
          images: ['stored:file:///antiga.jpg'],
          description: 'Cachorro preto',
          latitude: null,
          longitude: null,
          location: 'Centro',
        })
      );
      expect(locationService.getCoordsFromAddress).not.toHaveBeenCalled();
    });

    it('deve avisar quando falhar ao salvar a edição', async () => {
      postService.updatePost.mockRejectedValueOnce(new Error('falha'));
      const onSaved = jest.fn();
      const { result } = renderEdit(existingPost, onSaved);

      await act(async () => {
        await result.current.submit();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Não foi possível salvar',
        'Tente salvar o registro novamente.'
      );
      expect(postPhotoStorage.removeAll).not.toHaveBeenCalled();
      expect(onSaved).not.toHaveBeenCalled();
    });
  });
});
