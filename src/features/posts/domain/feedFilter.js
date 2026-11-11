import { normalizeText } from '../../../shared/utils/text';

export const ALL_SPECIES = 'Todos';

export const EMPTY_FILTER = { species: '', text: '' };

const SEARCH_FIELDS = ['petName', 'breed', 'color', 'description', 'location'];

const matchesSpecies = (post, species) => !species || post.species === species;

function matchesText(post, text) {
  const query = normalizeText(text);
  if (!query) return true;
  return SEARCH_FIELDS.some((field) =>
    normalizeText(post[field]).includes(query)
  );
}

export const isFiltering = (filter) =>
  Boolean(filter.species) || Boolean(normalizeText(filter.text));

export function filterPosts(posts, filter) {
  return posts.filter(
    (post) =>
      matchesSpecies(post, filter.species) && matchesText(post, filter.text)
  );
}
