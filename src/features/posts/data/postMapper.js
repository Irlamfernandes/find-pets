import { getPostStatus } from '../domain/post';

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
  return { ...fields, images };
}
