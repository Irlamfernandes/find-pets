import { formatDateTime } from '../../../shared/utils/timeZone';

// Regras do registro de um pet, sem dependência de tela ou armazenamento

export const POST_STATUS = { LOST: 'Perdido', FOUND: 'Encontrado' };

// Sem status informado, o pet está perdido
export const getPostStatus = (post) => post.status || POST_STATUS.LOST;

// O pet já foi encontrado
export const isFound = (post) => getPostStatus(post) === POST_STATUS.FOUND;

// O registro foi feito pelo usuário
export const isOwnedBy = (post, usuario) =>
  Boolean(usuario) && post.author === usuario;

// Só quem registrou pode editar ou marcar como encontrado, enquanto o pet
// ainda estiver perdido
export const canManage = (post, usuario) =>
  isOwnedBy(post, usuario) && !isFound(post);

// O registro tem latitude e longitude válidas (aparece no mapa)
export const hasCoordinates = (post) =>
  Number.isFinite(post.latitude) && Number.isFinite(post.longitude);

// Texto da data do desaparecimento, no fuso em que aconteceu; sem data
// válida, usa `missing`
export function getOccurredAtLabel(post, missing = 'Data não informada') {
  return formatDateTime(post.occurredAt, post.occurredZone) || missing;
}

// Alterações que registram o reencontro
export const markAsFound = (foundInfo) => ({
  status: POST_STATUS.FOUND,
  foundInfo,
});

// Monta um registro de desaparecimento novo, já com status e data
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
    // Fuso de onde aconteceu, para exibir a hora certa em qualquer país
    occurredZone,
    status: POST_STATUS.LOST,
    contactPhone: contactPhone || null,
  };
}
