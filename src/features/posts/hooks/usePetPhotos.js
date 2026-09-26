import { useState } from 'react';
import { photoService } from '../../../shared/services/photoService';
import { locationService } from '../../../shared/services/locationService';
import { useAppAlert } from '../../../shared/components/AppAlert';
import { getPostImages } from '../utils/postImages';

export const MAX_PHOTOS = 5;

// A câmera aberta pelo app nem sempre grava GPS na foto (no iPhone nunca
// grava). Por isso o local é registrado no momento da foto, e não depois.
async function takePhotoWithLocation() {
  const result = await photoService.takePhoto();
  if (result.denied || result.photos.length === 0) return result;

  // Sem permissão ou sinal, o serviço devolve latitude/longitude nulas
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

// Fotos do registro (até MAX_PHOTOS), vindas da câmera ou da galeria.
// Na edição, começa com as fotos já salvas no registro.
export function usePetPhotos(initialPost) {
  const showAlert = useAppAlert();
  const [photos, setPhotos] = useState(() =>
    initialPost ? getPostImages(initialPost).map((uri) => ({ uri })) : []
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
