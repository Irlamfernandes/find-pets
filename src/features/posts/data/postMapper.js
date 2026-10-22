import { getPostStatus } from '../domain/post';
import { SYNC_STATUS } from '../../../shared/database/syncFields';

// Converte o registro usado pelo app ({ petName, ... }) na linha da tabela
// posts ({ pet_name, ... }) e vice-versa. As fotos ficam em outra tabela.

// Campo do registro -> coluna da tabela
const COLUMNS = {
  id: 'id',
  author: 'author_id',
  petName: 'pet_name',
  species: 'species',
  size: 'size',
  sex: 'sex',
  color: 'color',
  breed: 'breed',
  description: 'description',
  latitude: 'latitude',
  longitude: 'longitude',
  location: 'location',
  occurredAt: 'occurred_at',
  occurredZone: 'occurred_zone',
  status: 'status',
  contactPhone: 'contact_phone',
  foundInfo: 'found_info',
};

// Campos que guardam objetos, gravados como texto JSON
const JSON_FIELDS = new Set(['occurredZone', 'foundInfo']);

// Campo que é gravado como texto JSON
const isJsonField = (field) => JSON_FIELDS.has(field);

// Valor do registro -> valor da coluna (objetos viram texto JSON)
function encode(field, value) {
  if (value === undefined || value === null) return null;
  return isJsonField(field) ? JSON.stringify(value) : value;
}

// Valor da coluna -> valor do registro (texto JSON volta a ser objeto)
function decode(field, value) {
  if (value === null) return null;
  return isJsonField(field) ? JSON.parse(value) : value;
}

const COLUMN_ENTRIES = Object.entries(COLUMNS);

export const POST_COLUMNS = Object.values(COLUMNS);

// Registro do app -> linha da tabela posts (o status é sempre preenchido)
export function toPostRow(post) {
  const values = { ...post, status: getPostStatus(post) };
  return Object.fromEntries(
    COLUMN_ENTRIES.map(([field, column]) => [
      column,
      encode(field, values[field]),
    ])
  );
}

// Linha da tabela posts -> registro do app, com as fotos e a situação da
// sincronização
export function fromPostRow(row, images = []) {
  const fields = Object.fromEntries(
    COLUMN_ENTRIES.map(([field, column]) => [field, decode(field, row[column])])
  );
  return { ...fields, images, syncStatus: row.sync_status };
}

// Registro no formato da nuvem, com as datas de controle e as fotos já
// convertidas
export function toApiPost(row, imageUrls) {
  return {
    ...fromPostRow(row, imageUrls),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

// Linha da tabela a partir do registro que veio da nuvem (já sincronizado).
// O banco da nuvem não guarda campos vazios, como a data de exclusão.
export function fromApiPost(remote) {
  return {
    ...toPostRow(remote),
    created_at: remote.createdAt,
    updated_at: remote.updatedAt,
    deleted_at: remote.deletedAt ?? null,
    sync_status: SYNC_STATUS.SYNCED,
  };
}
