import { useState } from 'react';
import { postService } from '../services/postService';
import { photoService } from '../services/photoService';
import { postPhotoStorage } from '../services/photoStorage';
import { locationService } from '../services/locationService';
import { onboardingService } from '../services/onboarding';
import { sessionService } from '../services/session';
import { getPhotosMetadata } from '../utils/photoMetadata';
import { getTimeZoneInfo } from '../utils/timeZone';
import { getPostImages } from '../utils/postImages';
import { useAppAlert } from '../components/AppAlert';

export const MAX_PHOTOS = 5;

// Campos descritivos do pet, na ordem em que aparecem no formulário
const PET_FIELDS = [
  'petName',
  'species',
  'size',
  'sex',
  'color',
  'breed',
  'description',
];

function initialPetData(post) {
  return Object.fromEntries(
    PET_FIELDS.map((field) => [field, post?.[field] || ''])
  );
}

// Cria um registro novo ou, com `initialPost`, edita um existente
export function useReportLostPet(onSaved, initialPost = null) {
  const showAlert = useAppAlert();
  const isEditing = Boolean(initialPost);
  const [photos, setPhotos] = useState(() =>
    isEditing ? getPostImages(initialPost).map((uri) => ({ uri })) : []
  );
  const [petData, setPetData] = useState(() => initialPetData(initialPost));
  const [address, setAddress] = useState(initialPost?.location || '');
  const [isSaving, setIsSaving] = useState(false);

  const remainingPhotos = MAX_PHOTOS - photos.length;

  const setPetField = (field, value) => {
    setPetData((current) => ({ ...current, [field]: value }));
  };

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

  // A câmera aberta pelo app nem sempre grava GPS na foto (no iPhone nunca
  // grava). Por isso o local é registrado no momento da foto, e não depois.
  const takePhotoWithLocation = async () => {
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
  };

  const takePhoto = () =>
    addPhotos(
      takePhotoWithLocation,
      'Permita o acesso à câmera para fotografar o seu pet.'
    );

  const removePhoto = (uri) => {
    setPhotos((current) => current.filter((photo) => photo.uri !== uri));
  };

  // Prioridade: GPS da foto (ou local registrado ao fotografar) > endereço
  // digitado > localização atual do aparelho
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

  // Na edição, a localização só é recalculada se o endereço mudar
  const resolveEditedLocation = async (typedAddress) => {
    const unchanged = {
      latitude: initialPost.latitude ?? null,
      longitude: initialPost.longitude ?? null,
      location: initialPost.location,
    };
    if (!typedAddress || typedAddress === initialPost.location) {
      return unchanged;
    }

    const coords = await locationService.getCoordsFromAddress(typedAddress);
    return {
      latitude: coords ? coords.latitude : unchanged.latitude,
      longitude: coords ? coords.longitude : unchanged.longitude,
      location: typedAddress,
    };
  };

  const trimmedPetData = () =>
    Object.fromEntries(
      PET_FIELDS.map((field) => [field, petData[field].trim()])
    );

  const validate = () => {
    if (photos.length === 0) {
      showAlert({
        type: 'warning',
        title: 'Adicione uma foto',
        message: 'Inclua pelo menos uma foto do pet para ajudar a encontrá-lo.',
      });
      return false;
    }

    if (!petData.species) {
      showAlert({
        type: 'warning',
        title: 'Escolha a espécie',
        message: 'Informe se o pet é cachorro, gato ou outro animal.',
      });
      return false;
    }
    return true;
  };

  const createPost = async (images) => {
    const { coords, occurredAt, occurredZone } = getPhotosMetadata(photos);
    const eventDate = occurredAt || new Date();
    const locationData = await resolveLocation(coords, address.trim());
    const userProfile = await onboardingService.getUserProfile();
    const session = await sessionService.getSession();

    await postService.savePost({
      id: Date.now().toString(),
      author: session?.usuario || null,
      images,
      imageUri: images[0],
      ...trimmedPetData(),
      ...locationData,
      occurredAt: eventDate.toISOString(),
      // Fuso de onde aconteceu, para exibir a hora certa em qualquer país
      occurredZone: occurredZone || getTimeZoneInfo(eventDate),
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
  };

  const updatePost = async (images) => {
    const locationData = await resolveEditedLocation(address.trim());
    await postService.updatePost(initialPost.id, {
      images,
      imageUri: images[0],
      ...trimmedPetData(),
      ...locationData,
    });

    // Apaga do aparelho as fotos que saíram do registro
    const previousImages = getPostImages(initialPost);
    postPhotoStorage.removeAll(
      previousImages.filter((uri) => !images.includes(uri))
    );

    showAlert({
      type: 'success',
      title: 'Registro atualizado',
      message: 'As alterações já aparecem na lista de pets perdidos.',
    });
  };

  const submit = async () => {
    if (isSaving || !validate()) return;

    setIsSaving(true);
    try {
      // Copia as fotos novas para a pasta permanente do app
      const images = await postPhotoStorage.persistAll(
        photos.map((photo) => photo.uri)
      );
      await (isEditing ? updatePost(images) : createPost(images));
      onSaved?.();
    } catch {
      showAlert({
        type: 'danger',
        title: isEditing
          ? 'Não foi possível salvar'
          : 'Não foi possível registrar',
        message: 'Tente salvar o registro novamente.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isEditing,
    photos,
    petData,
    setPetField,
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
