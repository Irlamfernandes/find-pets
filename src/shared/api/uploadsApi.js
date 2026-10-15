import { File } from 'expo-file-system';
import { request } from './httpClient';

// Fotos que já estão no servidor (vieram de outro celular ou já enviadas)
export const isRemoteUri = (uri) => /^https?:\/\//i.test(uri || '');

// Envia uma foto do celular e devolve o endereço dela no servidor. O fetch do
// Expo só aceita arquivos que leem os próprios bytes, como o File do
// expo-file-system (que também informa o nome e o tipo da foto), e não o
// { uri, name, type } do React Native.
export async function uploadPhoto(token, localUri) {
  const form = new FormData();
  form.append('file', new File(localUri));
  const { url } = await request('/uploads', {
    method: 'POST',
    form,
    token,
  });
  return url;
}
