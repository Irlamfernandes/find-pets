import { isFound as isFoundPost, getOccurredAtLabel } from '../domain/post';
import { formatPhone } from '../../../shared/utils/phoneMask';
import { getPetFields, getPetTitle } from './petDescription';

function getPosterPhone(post, isFound) {
  if (isFound || !post.contactPhone) return '';
  return formatPhone(post.contactPhone);
}

export function getPosterContent(post) {
  const isFound = isFoundPost(post);

  return {
    isFound,
    headline: isFound ? 'ENCONTRADO' : 'PROCURA-SE',
    image: post.images[0],
    title: getPetTitle(post) || 'Pet',
    fields: getPetFields(post, { includeName: false }),
    occurredAt: getOccurredAtLabel(post, ''),
    location: post.location || '',
    description: post.description || '',
    phone: getPosterPhone(post, isFound),
  };
}

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
