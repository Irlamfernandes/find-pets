import { getPostStatus } from '../domain/post';
import { SYNC_STATUS } from '../../../shared/database/syncFields';

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

const JSON_FIELDS = new Set(['occurredZone', 'foundInfo']);

const isJsonField = (field) => JSON_FIELDS.has(field);

function encode(field, value) {
  if (value === undefined || value === null) return null;
  return isJsonField(field) ? JSON.stringify(value) : value;
}

function decode(field, value) {
  if (value === null) return null;
  return isJsonField(field) ? JSON.parse(value) : value;
}

const COLUMN_ENTRIES = Object.entries(COLUMNS);

export const POST_COLUMNS = Object.values(COLUMNS);

export function toPostRow(post) {
  const values = { ...post, status: getPostStatus(post) };
  return Object.fromEntries(
    COLUMN_ENTRIES.map(([field, column]) => [
      column,
      encode(field, values[field]),
    ])
  );
}

export function fromPostRow(row, images = []) {
  const fields = Object.fromEntries(
    COLUMN_ENTRIES.map(([field, column]) => [field, decode(field, row[column])])
  );
  return { ...fields, images, syncStatus: row.sync_status };
}

export function toApiPost(row, imageUrls) {
  const post = fromPostRow(row, imageUrls);
  delete post.syncStatus;
  return {
    ...post,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function fromApiPost(remote) {
  return {
    ...toPostRow(remote),
    created_at: remote.createdAt,
    updated_at: remote.updatedAt,
    deleted_at: remote.deletedAt ?? null,
    sync_status: SYNC_STATUS.SYNCED,
  };
}
