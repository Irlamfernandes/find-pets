import { useState } from 'react';
import { photoService } from '../../../shared/services/photoService';
import { locationService } from '../../../shared/services/locationService';
import { useAppAlert } from '../../../shared/components/AppAlert';

export const MAX_PHOTOS = 5;

async function takePhotoWithLocation() {
  const result = await photoService.takePhoto();
  if (result.denied || result.photos.length === 0) return result;

  const { latitude, longitude } = await locationService.getCurrentLocation();
  if (latitude === null) return result;

  return {
    ...result,
    photos: result.photos.map((item) => ({
      ...item,
      coords: { latitude, longitude },
    })),
  };
}

export function usePetPhotos(initialPost) {
  const showAlert = useAppAlert();
  const [photos, setPhotos] = useState(() =>
    initialPost ? initialPost.images.map((uri) => ({ uri })) : []
  );
  const remainingPhotos = MAX_PHOTOS - photos.length;

  const addPhotos = async (pickPhotos, deniedMessage) => {
    if (remainingPhotos <= 0) {
      showAlert({
        type: 'warning',
        title: 'Limite de fotos',
        message: `Você pode adicionar até ${MAX_PHOTOS} fotos.`,
      });
      return;
    }

    try {
      const { photos: newPhotos, denied } = await pickPhotos();
      if (denied) {
        showAlert({
          type: 'warning',
          title: 'Permissão necessária',
          message: deniedMessage,
        });
        return;
      }
      setPhotos((current) => [...current, ...newPhotos].slice(0, MAX_PHOTOS));
    } catch {
      showAlert({
        type: 'danger',
        title: 'Não foi possível adicionar',
        message: 'Tente adicionar a foto novamente.',
      });
    }
  };

  return {
    photos,
    remainingPhotos,
    pickFromGallery: () =>
      addPhotos(
        () => photoService.pickFromGallery(remainingPhotos),
        'Permita o acesso às fotos para anexar imagens do seu pet.'
      ),
    takePhoto: () =>
      addPhotos(
        takePhotoWithLocation,
        'Permita o acesso à câmera para fotografar o seu pet.'
      ),
    removePhoto: (uri) =>
      setPhotos((current) => current.filter((photo) => photo.uri !== uri)),
  };
}
