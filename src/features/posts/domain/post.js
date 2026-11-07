import { formatDateTime } from '../../../shared/utils/timeZone';

export const POST_STATUS = { LOST: 'Perdido', FOUND: 'Encontrado' };

export const getPostStatus = (post) => post.status || POST_STATUS.LOST;

export const isFound = (post) => getPostStatus(post) === POST_STATUS.FOUND;

export const isOwnedBy = (post, usuario) =>
  Boolean(usuario) && post.author === usuario;

export const canManage = (post, usuario) =>
  isOwnedBy(post, usuario) && !isFound(post);

export const hasCoordinates = (post) =>
  Number.isFinite(post.latitude) && Number.isFinite(post.longitude);

export function getOccurredAtLabel(post, missing = 'Data não informada') {
  return formatDateTime(post.occurredAt, post.occurredZone) || missing;
}

export const markAsFound = (foundInfo) => ({
  status: POST_STATUS.FOUND,
  foundInfo,
});

export function createLostPost({
  id,
  author,
  images,
  petData,
  location,
  occurredAt,
  occurredZone,
  contactPhone,
}) {
  return {
    id,
    author: author || null,
    images,
    ...petData,
    ...location,
    occurredAt: occurredAt.toISOString(),
    occurredZone,
    status: POST_STATUS.LOST,
    contactPhone: contactPhone || null,
  };
}
