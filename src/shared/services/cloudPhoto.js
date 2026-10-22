import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// As fotos vão para o Realtime Database como texto (data URI em base64),
// reduzidas para não pesar no banco nem na sincronização
const MAX_WIDTH = 800;
const QUALITY = 0.6;
const DATA_URI_PREFIX = 'data:image/jpeg;base64,';

// Foto que já está no formato da nuvem (veio de outro celular ou já enviada)
export const isCloudPhoto = (uri) =>
  typeof uri === 'string' && uri.startsWith('data:');

// Converte a foto guardada no celular para o formato da nuvem
export async function toCloudPhoto(localUri) {
  const context = ImageManipulator.manipulate(localUri);
  context.resize({ width: MAX_WIDTH });
  const image = await context.renderAsync();
  const { base64 } = await image.saveAsync({
    base64: true,
    compress: QUALITY,
    format: SaveFormat.JPEG,
  });
  return `${DATA_URI_PREFIX}${base64}`;
}
