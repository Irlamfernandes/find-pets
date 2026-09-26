import * as ImagePicker from 'expo-image-picker';

const PICKER_OPTIONS = {
  mediaTypes: ['images'],
  quality: 0.5,
  exif: true,
};

function toPhotos(result) {
  if (result.canceled || !result.assets) return [];
  return result.assets.map((asset) => ({ uri: asset.uri, exif: asset.exif }));
}

export const photoService = {
  // Retorna { photos, denied } para a tela decidir qual mensagem exibir
  async pickFromGallery(selectionLimit) {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return { photos: [], denied: true };

    const result = await ImagePicker.launchImageLibraryAsync({
      ...PICKER_OPTIONS,
      allowsMultipleSelection: true,
      selectionLimit,
    });
    return { photos: toPhotos(result), denied: false };
  },

  async takePhoto() {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) return { photos: [], denied: true };

    const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    return { photos: toPhotos(result), denied: false };
  },

  // Foto de perfil: uma única imagem com recorte quadrado
  async pickProfilePhoto(source) {
    const fromCamera = source === 'camera';
    const { granted } = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return { uri: null, denied: true };

    const options = {
      mediaTypes: ['images'],
      quality: 0.6,
      allowsEditing: true,
      aspect: [1, 1],
    };
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    const [photo] = toPhotos(result);
    return { uri: photo?.uri ?? null, denied: false };
  },
};
