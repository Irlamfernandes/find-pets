import { createJsonStore } from '../../../shared/services/storage';
import { STORAGE_KEYS } from '../../../shared/constants/storageKeys';
import { breedsApi } from '../api/breedsApi';

const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const FETCHERS = {
  Cachorro: () => breedsApi.fetchDogBreeds(),
  Gato: () => breedsApi.fetchCatBreeds(),
};

const cacheStore = createJsonStore(STORAGE_KEYS.BREEDS, { fallback: {} });

async function readCached(species) {
  const cached = (await cacheStore.read())[species];
  return Array.isArray(cached?.breeds) ? cached : null;
}

const isRecent = (cached) => Date.now() - cached.savedAt < MAX_AGE_MS;

async function download(species) {
  const breeds = await FETCHERS[species]();
  await cacheStore.update((cache) => ({
    ...cache,
    [species]: { breeds, savedAt: Date.now() },
  }));
  return breeds;
}

export const breedService = {
  async getBreeds(species) {
    if (!FETCHERS[species]) return [];

    const cached = await readCached(species);
    if (cached && isRecent(cached)) return cached.breeds;
    try {
      return await download(species);
    } catch {
      return cached ? cached.breeds : [];
    }
  },
};
