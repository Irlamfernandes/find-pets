// Espécies do formulário que têm lista de raças
export const BREED_SPECIES = ['Cachorro', 'Gato'];
// Letras digitadas a partir das quais as sugestões aparecem
export const MIN_SEARCH_LENGTH = 2;
const MAX_SUGGESTIONS = 5;

// Texto sem acentos, em minúsculas e sem espaços nas pontas, para comparar
export const normalize = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

// Primeira letra de cada palavra em maiúscula ("french bulldog" vira
// "French Bulldog")
const capitalize = (text) =>
  text.replace(/\b\w/g, (letter) => letter.toUpperCase());

// Na Dog CEO, estas chaves são adjetivos e a variação vem depois
// ("german" + "shepherd" = "German Shepherd"); sozinhas não são raças
const QUALIFIER_KEYS = [
  'african',
  'australian',
  'danishswedish',
  'finnish',
  'german',
  'rough',
];

// Nomes de uma raça da Dog CEO e de suas variações
function namesOf(breed, subBreeds) {
  if (QUALIFIER_KEYS.includes(breed)) {
    return subBreeds.map((subBreed) => capitalize(`${breed} ${subBreed}`));
  }
  return [
    capitalize(breed),
    ...subBreeds.map((subBreed) => capitalize(`${subBreed} ${breed}`)),
  ];
}

// Converte a lista da Dog CEO ({ bulldog: ['french'] }) em nomes de raça:
// a raça principal e cada variação ("Bulldog", "French Bulldog")
export function dogBreedNames(message) {
  return Object.entries(message).flatMap(([breed, subBreeds]) =>
    namesOf(breed, subBreeds)
  );
}

// Até 5 raças que contêm o texto digitado, primeiro as que começam com ele.
// A raça já digitada por inteiro não é sugerida de novo.
export function searchBreeds(breeds, text) {
  const query = normalize(text);
  if (query.length < MIN_SEARCH_LENGTH) return [];

  const matches = breeds.filter((breed) => {
    const name = normalize(breed);
    return name.includes(query) && name !== query;
  });
  // 0 para as que começam com o texto, 1 para as demais
  const rank = (breed) => (normalize(breed).startsWith(query) ? 0 : 1);
  return matches.sort((a, b) => rank(a) - rank(b)).slice(0, MAX_SUGGESTIONS);
}
