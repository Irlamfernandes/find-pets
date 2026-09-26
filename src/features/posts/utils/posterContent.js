import { isFound as isFoundPost, getOccurredAtLabel } from '../domain/post';
import { formatPhone, withCountryCode } from '../../../shared/utils/phoneMask';
import { getPostImages } from './postImages';
import { getPetFields, getPetTitle } from './petDescription';

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
    occurredAt: getOccurredAtLabel(post),
    location: post.location || '',
    description: post.description || '',
    // Depois do reencontro, o contato não precisa mais circular
    phone:
      post.contactPhone && !isFound
        ? formatPhone(withCountryCode(post.contactPhone))
        : '',
  };
}
