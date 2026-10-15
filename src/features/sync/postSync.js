import { HttpError } from '../../shared/api/httpClient';
import { isRemoteUri, uploadPhoto } from '../../shared/api/uploadsApi';
import { inTransaction } from '../../shared/database/connection';
import { postsApi } from '../posts/api/postsApi';
import { toApiPost } from '../posts/data/postMapper';
import { postImageRepository } from '../posts/data/postImageRepository';
import { postRepository } from '../posts/data/postRepository';
import { syncCursor } from './syncCursor';

// Endereço da foto no servidor; envia a foto só se ainda não foi enviada
async function imageUrlOf(token, image) {
  if (image.remote_url) return image.remote_url;
  if (isRemoteUri(image.local_uri)) return image.local_uri;

  const url = await uploadPhoto(token, image.local_uri);
  await postImageRepository.setRemoteUrl(image.id, url);
  return url;
}

async function uploadImages(token, postId) {
  const urls = [];
  for (const image of await postImageRepository.findActiveOfPost(postId)) {
    urls.push(await imageUrlOf(token, image));
  }
  return urls;
}

const saveSynced = (remote) =>
  inTransaction(() => postRepository.saveSynced(remote));

async function pushPost(token, row) {
  const urls = await uploadImages(token, row.id);
  const remote = await postsApi.save(token, toApiPost(row, urls));
  // Se o registro mudou durante o envio, a versão nova vai na próxima vez
  if ((await postRepository.findUpdatedAt(row.id)) === row.updated_at) {
    await saveSynced(remote);
  }
}

// O servidor recusou o registro (dados inválidos): os outros seguem sendo
// enviados e ele continua pendente
const isRejected = (error) =>
  error instanceof HttpError && error.status !== 401 && error.status < 500;

// Envia os registros alterados neste celular (inclusive exclusões)
export async function pushPosts(token) {
  for (const row of await postRepository.findPendingRows()) {
    try {
      await pushPost(token, row);
    } catch (error) {
      if (!isRejected(error)) throw error;
    }
  }
}

// Baixa o que mudou no servidor: registros de todos os usuários e exclusões.
// Alterações locais ainda não enviadas têm prioridade.
export async function pullPosts(token, usuario) {
  const since = await syncCursor.get(usuario);
  const remotePosts = await postsApi.listChangedSince(token, since);
  const pending = await postRepository.findPendingRows();
  const pendingIds = new Set(pending.map((row) => row.id));

  for (const remote of remotePosts) {
    if (!pendingIds.has(remote.id)) await saveSynced(remote);
  }
  const last = remotePosts[remotePosts.length - 1];
  if (last) await syncCursor.save(usuario, last.serverUpdatedAt);
}
