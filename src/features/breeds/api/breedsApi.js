import { dogBreedNames } from '../domain/breeds';

const DOG_BREEDS_URL = 'https://dog.ceo/api/breeds/list/all';
const CAT_BREEDS_URL = 'https://catfact.ninja/breeds?limit=200';
const TIMEOUT_MS = 10000;

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
  async fetchDogBreeds() {
    const data = await getJson(DOG_BREEDS_URL);
    return dogBreedNames(data.message);
  },

  async fetchCatBreeds() {
    const data = await getJson(CAT_BREEDS_URL);
    return data.data.map((item) => item.breed);
  },
};
