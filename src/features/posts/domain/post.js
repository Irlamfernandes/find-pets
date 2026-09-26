import { formatDateTime } from '../../../shared/utils/timeZone';

// Regras do registro de um pet, sem dependência de tela ou armazenamento

export const POST_STATUS = { LOST: 'Perdido', FOUND: 'Encontrado' };

// Registros antigos guardavam o status em `type`
export const getPostStatus = (post) => post.status || post.type;

export const isFound = (post) => getPostStatus(post) === POST_STATUS.FOUND;

export const isOwnedBy = (post, usuario) =>
  Boolean(usuario) && post.author === usuario;

// Só quem registrou pode editar ou marcar como encontrado, enquanto o pet
// ainda estiver perdido
export const canManage = (post, usuario) =>
  isOwnedBy(post, usuario) && !isFound(post);

export const hasCoordinates = (post) =>
  Number.isFinite(post.latitude) && Number.isFinite(post.longitude);

// Texto da data do desaparecimento, no fuso em que aconteceu
export function getOccurredAtLabel(post) {
  return post.occurredAt
    ? formatDateTime(post.occurredAt, post.occurredZone)
    : post.date;
}

// Alterações que registram o reencontro
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
    imageUri: images[0],
    ...petData,
    ...location,
    occurredAt: occurredAt.toISOString(),
    // Fuso de onde aconteceu, para exibir a hora certa em qualquer país
    occurredZone,
    date: occurredAt.toLocaleDateString('pt-BR'),
    type: POST_STATUS.LOST,
    status: POST_STATUS.LOST,
    contactPhone: contactPhone || null,
  };
}
