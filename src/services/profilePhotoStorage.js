import { File, Paths } from 'expo-file-system';

// As fotos do seletor ficam no cache do app, que o sistema pode limpar.
// A foto do perfil é copiada para a pasta de documentos para não se perder.
const FILE_PREFIX = 'profile-photo-';

function isStoredPhoto(uri) {
  return typeof uri === 'string' && uri.includes(`/${FILE_PREFIX}`);
}

export const profilePhotoStorage = {
  async persist(uri) {
    if (!uri) return null;
    if (isStoredPhoto(uri)) return uri;

    const destination = new File(
      Paths.document,
      `${FILE_PREFIX}${Date.now()}.jpg`
    );
    await new File(uri).copy(destination);
    return destination.uri;
  },

  // Remove uma foto antiga do perfil; falhas não impedem o fluxo
  remove(uri) {
    if (!isStoredPhoto(uri)) return;
    try {
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch {
      // Arquivo já removido ou inacessível
    }
  },
};
