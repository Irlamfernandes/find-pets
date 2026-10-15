import { getDatabase } from '../../../shared/database/connection';
import {
  runCommand,
  upsertCommand,
} from '../../../shared/database/sqlCommands';
import {
  createdFields,
  SYNC_STATUS,
} from '../../../shared/database/syncFields';
import { fromProfileRow, toProfileRow } from './profileMapper';

const TABLE = 'profiles';

const SELECT_ACTIVE_BY_USER = `
SELECT * FROM profiles WHERE user_id = ? AND deleted_at IS NULL`;

const UPSERT_OPTIONS = {
  conflictColumns: ['user_id'],
  updateColumns: [
    'name',
    'whatsapp',
    'photo_uri',
    'photo_remote_url',
    'updated_at',
    'deleted_at',
    'sync_status',
  ],
};

async function findRow(userId) {
  const database = await getDatabase();
  return database.getFirstAsync(SELECT_ACTIVE_BY_USER, [userId]);
}

const saveRow = (row) => runCommand(upsertCommand(TABLE, row, UPSERT_OPTIONS));

// Endereço da foto no servidor só continua valendo se a foto não mudou
function keptRemotePhoto(current, photoUri) {
  return current?.photo_uri === photoUri ? current.photo_remote_url : null;
}

// Mantém a foto do celular quando ela é a mesma que está no servidor
function localPhotoFor(current, remotePhotoUrl) {
  const isSamePhoto =
    Boolean(remotePhotoUrl) && current?.photo_remote_url === remotePhotoUrl;
  return isSamePhoto ? current.photo_uri : remotePhotoUrl;
}

// Acesso à tabela profiles (uma linha por conta)
export const profileRepository = {
  findRow,

  async findByUser(userId) {
    const row = await findRow(userId);
    return row ? fromProfileRow(row) : null;
  },

  // Alteração feita no celular: fica pendente de envio
  async save(userId, profile) {
    const row = toProfileRow(userId, profile);
    const current = await findRow(userId);
    await saveRow({
      ...row,
      photo_remote_url: keptRemotePhoto(current, row.photo_uri),
      ...createdFields(),
    });
  },

  // Perfil que veio do servidor: já sincronizado
  async saveSynced(userId, remote) {
    const current = await findRow(userId);
    await saveRow({
      ...toProfileRow(userId, {
        ...remote,
        photoUri: localPhotoFor(current, remote.photoUrl),
      }),
      photo_remote_url: remote.photoUrl || null,
      ...createdFields(remote.updatedAt),
      sync_status: SYNC_STATUS.SYNCED,
    });
  },

  async setPhotoRemoteUrl(userId, url) {
    await runCommand({
      sql: 'UPDATE profiles SET photo_remote_url = ? WHERE user_id = ?',
      params: [url, userId],
    });
  },

  // Só marca como enviado se o perfil não mudou durante o envio
  async markSynced(userId, updatedAt) {
    await runCommand({
      sql: 'UPDATE profiles SET sync_status = ? WHERE user_id = ? AND updated_at = ?',
      params: [SYNC_STATUS.SYNCED, userId, updatedAt],
    });
  },
};
