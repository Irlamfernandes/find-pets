import { dogBreedNames } from '../domain/breeds';

// APIs públicas e gratuitas, sem chave de acesso
const DOG_BREEDS_URL = 'https://dog.ceo/api/breeds/list/all';
const CAT_BREEDS_URL = 'https://catfact.ninja/breeds?limit=200';
// Sem resposta nesse tempo (internet ruim), a busca desiste
const TIMEOUT_MS = 10000;

// Busca o JSON da URL; falha se a resposta não for de sucesso ou demorar
async function getJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Resposta ${response.status} de ${url}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

export const breedsApi = {
  // Raças de cachorro, da Dog CEO (dog.ceo)
  async fetchDogBreeds() {
    const data = await getJson(DOG_BREEDS_URL);
    return dogBreedNames(data.message);
  },

  // Raças de gato, da Cat Facts (catfact.ninja)
  async fetchCatBreeds() {
    const data = await getJson(CAT_BREEDS_URL);
    return data.data.map((item) => item.breed);
  },
};
