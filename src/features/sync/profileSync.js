import { isRemoteUri, uploadPhoto } from '../../shared/api/uploadsApi';
import { SYNC_STATUS } from '../../shared/database/syncFields';
import { profileApi } from '../profile/api/profileApi';
import { profileRepository } from '../profile/data/profileRepository';

// Endereço da foto no servidor; envia a foto só se ainda não foi enviada
async function photoUrlOf(token, usuario, row) {
  if (!row.photo_uri) return null;
  if (row.photo_remote_url) return row.photo_remote_url;
  if (isRemoteUri(row.photo_uri)) return row.photo_uri;

  const url = await uploadPhoto(token, row.photo_uri);
  await profileRepository.setPhotoRemoteUrl(usuario, url);
  return url;
}

// Envia o perfil, se ele foi alterado neste celular
export async function pushProfile(token, usuario) {
  const row = await profileRepository.findRow(usuario);
  if (row?.sync_status !== SYNC_STATUS.PENDING) return;

  await profileApi.save(token, {
    name: row.name,
    whatsapp: row.whatsapp,
    photoUrl: await photoUrlOf(token, usuario, row),
  });
  await profileRepository.markSynced(usuario, row.updated_at);
}

// Baixa o perfil do servidor (ex.: primeiro acesso num celular novo).
// Uma alteração local ainda não enviada tem prioridade.
export async function pullProfile(token, usuario) {
  const row = await profileRepository.findRow(usuario);
  if (row?.sync_status === SYNC_STATUS.PENDING) return;

  const remote = await profileApi.get(token);
  if (remote) await profileRepository.saveSynced(usuario, remote);
}
