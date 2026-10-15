import { File, Paths } from 'expo-file-system';
import { isRemoteUri } from '../api/uploadsApi';

// As fotos do seletor ficam no cache do app, que o sistema pode limpar.
// Estas funções copiam as fotos para a pasta de documentos do app, onde
// ficam guardadas de forma permanente.
let sequence = 0;

export function createPhotoStorage(filePrefix) {
  const isStored = (uri) =>
    typeof uri === 'string' && uri.includes(`/${filePrefix}`);

  const persist = async (uri) => {
    if (!uri) return null;
    // Fotos já guardadas ou que estão no servidor não precisam de cópia
    if (isStored(uri) || isRemoteUri(uri)) return uri;

    sequence += 1;
    const destination = new File(
      Paths.document,
      `${filePrefix}${Date.now()}-${sequence}.jpg`
    );
    await new File(uri).copy(destination);
    return destination.uri;
  };

  // Remove uma foto salva; falhas não impedem o fluxo
  const remove = (uri) => {
    if (!isStored(uri)) return;
    try {
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch {
      // Arquivo já removido ou inacessível
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
