import { getDatabase } from '../../../shared/database/connection';
import {
  runCommand,
  upsertCommand,
} from '../../../shared/database/sqlCommands';
import { createdFields } from '../../../shared/database/syncFields';
import { fromProfileRow, toProfileRow } from './profileMapper';

const TABLE = 'profiles';

const SELECT_ACTIVE_BY_USER = `
SELECT * FROM profiles WHERE user_id = ? AND deleted_at IS NULL`;

// Acesso à tabela profiles (uma linha por conta)
export const profileRepository = {
  async findByUser(userId) {
    const database = await getDatabase();
    const row = await database.getFirstAsync(SELECT_ACTIVE_BY_USER, [userId]);
    return row ? fromProfileRow(row) : null;
  },

  // Cria o perfil da conta ou atualiza o existente (mantendo created_at)
  async save(userId, profile) {
    await runCommand(
      upsertCommand(
        TABLE,
        { ...toProfileRow(userId, profile), ...createdFields() },
        {
          conflictColumns: ['user_id'],
          updateColumns: [
            'name',
            'whatsapp',
            'photo_uri',
            'updated_at',
            'deleted_at',
            'sync_status',
          ],
        }
      )
    );
  },
};
