import { request } from './httpClient';

// Fotos que já estão no servidor (vieram de outro celular ou já enviadas)
export const isRemoteUri = (uri) => /^https?:\/\//i.test(uri || '');

const MIME_TYPES = { png: 'image/png', webp: 'image/webp' };

function toUploadFile(localUri) {
  const extension = (localUri.split('.').pop() || '').toLowerCase();
  const type = MIME_TYPES[extension] || 'image/jpeg';
  const name = `foto.${MIME_TYPES[extension] ? extension : 'jpg'}`;
  return { uri: localUri, name, type };
}

// Envia uma foto do celular e devolve o endereço dela no servidor
export async function uploadPhoto(token, localUri) {
  const form = new FormData();
  form.append('file', toUploadFile(localUri));
  const { url } = await request('/uploads', {
    method: 'POST',
    form,
    token,
  });
  return url;
}
