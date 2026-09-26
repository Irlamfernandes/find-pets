import { useState } from 'react';
import { postService } from '../services/postService';
import { photoService } from '../services/photoService';
import { locationService } from '../services/locationService';
import { onboardingService } from '../services/onboarding';
import { sessionService } from '../services/session';
import { getPhotosMetadata } from '../utils/photoMetadata';
import { useAppAlert } from '../components/AppAlert';

export const MAX_PHOTOS = 5;

export function useReportLostPet(onSaved) {
  const showAlert = useAppAlert();
  const [photos, setPhotos] = useState([]);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  const pickFromGallery = () =>
    addPhotos(
      () => photoService.pickFromGallery(remainingPhotos),
      'Permita o acesso às fotos para anexar imagens do seu pet.'
    );

  const takePhoto = () =>
    addPhotos(
      () => photoService.takePhoto(),
      'Permita o acesso à câmera para fotografar o seu pet.'
    );

  const removePhoto = (uri) => {
    setPhotos((current) => current.filter((photo) => photo.uri !== uri));
  };

  // Prioridade: GPS da foto > endereço digitado > localização atual do aparelho
  const resolveLocation = async (photoCoords, typedAddress) => {
    let coords = photoCoords;
    if (!coords)
      coords = await locationService.getCoordsFromAddress(typedAddress);
    if (!coords) {
      const current = await locationService.getCurrentLocation();
      if (current.latitude !== null && current.longitude !== null) {
        coords = { latitude: current.latitude, longitude: current.longitude };
      }
    }

    let locationText = typedAddress;
    if (!locationText && coords) {
      locationText =
        (await locationService.getAddressFromCoords(
          coords.latitude,
          coords.longitude
        )) ||
        `Lat: ${coords.latitude.toFixed(4)}, Lon: ${coords.longitude.toFixed(4)}`;
    }

    return {
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
      location: locationText || 'Localização não informada',
    };
  };

  const submit = async () => {
    if (isSaving) return;

    if (photos.length === 0) {
      showAlert({
        type: 'warning',
        title: 'Adicione uma foto',
        message: 'Inclua pelo menos uma foto do pet para ajudar a encontrá-lo.',
      });
      return;
    }

    if (!description.trim()) {
      showAlert({
        type: 'warning',
        title: 'Descreva o pet',
        message:
          'Conte como ele é e onde foi visto pela última vez (cor, porte, nome...).',
      });
      return;
    }

    setIsSaving(true);
    try {
      const { coords, occurredAt } = getPhotosMetadata(photos);
      const eventDate = occurredAt || new Date();
      const locationData = await resolveLocation(coords, address.trim());
      const userProfile = await onboardingService.getUserProfile();
      const session = await sessionService.getSession();
      const images = photos.map((photo) => photo.uri);

      await postService.savePost({
        id: Date.now().toString(),
        author: session?.usuario || null,
        images,
        imageUri: images[0],
        description: description.trim(),
        ...locationData,
        occurredAt: eventDate.toISOString(),
        date: eventDate.toLocaleDateString('pt-BR'),
        type: 'Perdido',
        status: 'Perdido',
        contactPhone: userProfile?.whatsapp || null,
      });

      showAlert({
        type: 'success',
        title: 'Desaparecimento registrado',
        message: 'O registro já aparece na lista de pets perdidos.',
      });
      onSaved?.();
    } catch {
      showAlert({
        type: 'danger',
        title: 'Não foi possível registrar',
        message: 'Tente salvar o registro novamente.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    photos,
    description,
    setDescription,
    address,
    setAddress,
    isSaving,
    remainingPhotos,
    pickFromGallery,
    takePhoto,
    removePhoto,
    submit,
  };
}
