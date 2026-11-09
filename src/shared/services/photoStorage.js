import { File, Paths } from 'expo-file-system';
import { isCloudPhoto } from './cloudPhoto';

let sequence = 0;

export function createPhotoStorage(filePrefix) {
  const isStored = (uri) =>
    typeof uri === 'string' && uri.includes(`/${filePrefix}`);

  const persist = async (uri) => {
    if (!uri) return null;
    if (isStored(uri) || isCloudPhoto(uri)) return uri;

    sequence += 1;
    const destination = new File(
      Paths.document,
      `${filePrefix}${Date.now()}-${sequence}.jpg`
    );
    await new File(uri).copy(destination);
    return destination.uri;
  };

  const remove = (uri) => {
    if (!isStored(uri)) return;
    try {
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch {
      return;
    }
  };

  return {
    persist,
    remove,
    persistAll: (uris) => Promise.all(uris.map(persist)),
  };
}

export const profilePhotoStorage = createPhotoStorage('profile-photo-');
export const postPhotoStorage = createPhotoStorage('post-photo-');
