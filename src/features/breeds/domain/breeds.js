import { normalizeText as normalize } from '../../../shared/utils/text';

export const BREED_SPECIES = ['Cachorro', 'Gato'];
export const MIN_SEARCH_LENGTH = 2;
const MAX_SUGGESTIONS = 5;

const capitalize = (text) =>
  text.replace(/\b\w/g, (letter) => letter.toUpperCase());

const QUALIFIER_KEYS = [
  'african',
  'australian',
  'danishswedish',
  'finnish',
  'german',
  'rough',
];

function namesOf(breed, subBreeds) {
  if (QUALIFIER_KEYS.includes(breed)) {
    return subBreeds.map((subBreed) => capitalize(`${breed} ${subBreed}`));
  }
  return [
    capitalize(breed),
    ...subBreeds.map((subBreed) => capitalize(`${subBreed} ${breed}`)),
  ];
}

export function dogBreedNames(message) {
  return Object.entries(message).flatMap(([breed, subBreeds]) =>
    namesOf(breed, subBreeds)
  );
}

export function searchBreeds(breeds, text) {
  const query = normalize(text);
  if (query.length < MIN_SEARCH_LENGTH) return [];

  const matches = breeds.filter((breed) => {
    const name = normalize(breed);
    return name.includes(query) && name !== query;
  });
  const rank = (breed) => (normalize(breed).startsWith(query) ? 0 : 1);
  return matches.sort((a, b) => rank(a) - rank(b)).slice(0, MAX_SUGGESTIONS);
}
