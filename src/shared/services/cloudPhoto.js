import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_WIDTH = 800;
const QUALITY = 0.6;
const DATA_URI_PREFIX = 'data:image/jpeg;base64,';

export const isCloudPhoto = (uri) =>
  typeof uri === 'string' && uri.startsWith('data:');

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
