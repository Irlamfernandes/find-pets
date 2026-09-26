import { isFound as isFoundPost, getOccurredAtLabel } from '../domain/post';
import { formatPhone, withCountryCode } from '../../../shared/utils/phoneMask';
import { getPostImages } from './postImages';
import { getPetFields, getPetTitle } from './petDescription';

// Depois do reencontro, o contato não precisa mais circular
function getPosterPhone(post, isFound) {
  if (isFound || !post.contactPhone) return '';
  return formatPhone(withCountryCode(post.contactPhone));
}

// Informações exibidas no cartaz de compartilhamento
export function getPosterContent(post) {
  const isFound = isFoundPost(post);

  return {
    isFound,
    headline: isFound ? 'ENCONTRADO' : 'PROCURA-SE',
    image: getPostImages(post)[0],
    title: getPetTitle(post) || 'Pet',
    // O nome já aparece como título do cartaz
    fields: getPetFields(post, { includeName: false }),
    // Sem data conhecida, a linha some do cartaz
    occurredAt: getOccurredAtLabel(post, ''),
    location: post.location || '',
    description: post.description || '',
    phone: getPosterPhone(post, isFound),
  };
}

// Linhas com ícone do cartaz; a data do desaparecimento sai depois do
// reencontro
export function getPosterInfoLines(content) {
  return [
    !content.isFound &&
      content.occurredAt && {
        icon: 'time-outline',
        text: `Desapareceu em ${content.occurredAt}`,
      },
    content.location && { icon: 'location-outline', text: content.location },
  ].filter(Boolean);
}
