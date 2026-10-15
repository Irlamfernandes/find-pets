import { postService } from './postService';
import { resolveNewPostLocation, resolveEditedLocation } from './postLocation';
import { createLostPost } from '../domain/post';
import { postPhotoStorage } from '../../../shared/services/photoStorage';
import { createId } from '../../../shared/utils/id';
import { getPhotosMetadata } from '../../../shared/utils/photoMetadata';
import { getTimeZoneInfo } from '../../../shared/utils/timeZone';
import { profileService } from '../../profile/services/profileService';
import { sessionService } from '../../auth/services/sessionService';

// Copia as fotos novas para a pasta permanente do app
const persistPhotos = (photos) =>
  postPhotoStorage.persistAll(photos.map((photo) => photo.uri));

// Publica o registro de um pet perdido. Data, hora e local vêm das fotos,
// quando disponíveis.
export async function publishLostPost({ photos, petData, address }) {
  const images = await persistPhotos(photos);
  const { coords, occurredAt, occurredZone } = getPhotosMetadata(photos);
  const eventDate = occurredAt || new Date();
  const location = await resolveNewPostLocation({
    photoCoords: coords,
    address,
  });
  const profile = await profileService.getProfile();
  const author = await sessionService.getCurrentUser();

  await postService.savePost(
    createLostPost({
      id: createId(),
      author,
      images,
      petData,
      location,
      occurredAt: eventDate,
      occurredZone: occurredZone || getTimeZoneInfo(eventDate),
      contactPhone: profile?.whatsapp,
    })
  );
}

// Salva a edição de um registro. As fotos que saíram dele continuam no
// aparelho, ligadas ao histórico do registro.
export async function updateLostPost(post, { photos, petData, address }) {
  const images = await persistPhotos(photos);
  const location = await resolveEditedLocation(post, address);
  await postService.updatePost(post.id, {
    images,
    ...petData,
    ...location,
  });
}
