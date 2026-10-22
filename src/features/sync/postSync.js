import { inTransaction } from '../../shared/database/connection';
import { isCloudPhoto, toCloudPhoto } from '../../shared/services/cloudPhoto';
import { postsApi } from '../posts/api/postsApi';
import { toApiPost } from '../posts/data/postMapper';
import { postImageRepository } from '../posts/data/postImageRepository';
import { postRepository } from '../posts/data/postRepository';
import { syncCursor } from './syncCursor';

// Foto no formato da nuvem; converte só se ainda não foi convertida
async function cloudPhotoOf(image) {
  if (image.remote_url) return image.remote_url;
  if (isCloudPhoto(image.local_uri)) return image.local_uri;

  const photo = await toCloudPhoto(image.local_uri);
  await postImageRepository.setRemoteUrl(image.id, photo);
  return photo;
}

// Fotos do registro no formato da nuvem, na ordem
async function cloudPhotosOf(postId) {
  const photos = [];
  for (const image of await postImageRepository.findActiveOfPost(postId)) {
    photos.push(await cloudPhotoOf(image));
  }
  return photos;
}

// Grava o registro como está na nuvem (sincronizado), numa transação
const saveSynced = (remote) =>
  inTransaction(() => postRepository.saveSynced(remote));

// Envia um registro com as fotos e marca como sincronizado
async function pushPost(uid, row) {
  const photos = await cloudPhotosOf(row.id);
  const remote = await postsApi.save({
    ...toApiPost(row, photos),
    authorUid: uid,
  });
  // Se o registro mudou durante o envio, a versão nova vai na próxima vez
  if ((await postRepository.findUpdatedAt(row.id)) === row.updated_at) {
    await saveSynced(remote);
  }
}

// Envia os registros que a conta alterou neste celular (inclusive
// exclusões). Os de outras contas do aparelho vão quando elas entrarem.
export async function pushPosts(uid, usuario) {
  const pending = await postRepository.findPendingRows();
  for (const row of pending.filter((item) => item.author_id === usuario)) {
    await pushPost(uid, row);
  }
}

// Baixa o que mudou na nuvem: registros de todos os usuários e exclusões.
// Alterações locais ainda não enviadas têm prioridade.
export async function pullPosts(usuario) {
  const since = await syncCursor.get(usuario);
  const remotePosts = await postsApi.listChangedSince(since);
  const pending = await postRepository.findPendingRows();
  const pendingIds = new Set(pending.map((row) => row.id));

  for (const remote of remotePosts) {
    if (!pendingIds.has(remote.id)) await saveSynced(remote);
  }
  const last = remotePosts.at(-1);
  if (last) await syncCursor.save(usuario, last.serverUpdatedAt);
}
