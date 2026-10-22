import { SYNC_STATUS } from '../../shared/database/syncFields';
import { isCloudPhoto, toCloudPhoto } from '../../shared/services/cloudPhoto';
import { profileApi } from '../profile/api/profileApi';
import { profileRepository } from '../profile/data/profileRepository';

// Foto no formato da nuvem; converte só se ainda não foi convertida
async function cloudPhotoOf(usuario, row) {
  if (!row.photo_uri) return null;
  if (row.photo_remote_url) return row.photo_remote_url;
  if (isCloudPhoto(row.photo_uri)) return row.photo_uri;

  const photo = await toCloudPhoto(row.photo_uri);
  await profileRepository.setPhotoRemoteUrl(usuario, photo);
  return photo;
}

// Envia o perfil, se ele foi alterado neste celular
export async function pushProfile(uid, usuario) {
  const row = await profileRepository.findRow(usuario);
  if (row?.sync_status !== SYNC_STATUS.PENDING) return;

  await profileApi.save(uid, {
    name: row.name,
    whatsapp: row.whatsapp,
    photoUrl: await cloudPhotoOf(usuario, row),
    updatedAt: row.updated_at,
  });
  await profileRepository.markSynced(usuario, row.updated_at);
}

// Baixa o perfil da nuvem (ex.: primeiro acesso num celular novo).
// Uma alteração local ainda não enviada tem prioridade.
export async function pullProfile(uid, usuario) {
  const row = await profileRepository.findRow(usuario);
  if (row?.sync_status === SYNC_STATUS.PENDING) return;

  const remote = await profileApi.get(uid);
  if (remote) await profileRepository.saveSynced(usuario, remote);
}
