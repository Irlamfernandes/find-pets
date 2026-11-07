import { createJsonStore } from '../../../shared/services/storage';
import { STORAGE_KEYS } from '../../../shared/constants/storageKeys';
import { breedsApi } from '../api/breedsApi';

// A lista guardada é baixada de novo depois de 30 dias
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

// API de cada espécie do formulário
const FETCHERS = {
  Cachorro: () => breedsApi.fetchDogBreeds(),
  Gato: () => breedsApi.fetchCatBreeds(),
};

// Listas guardadas no aparelho: { Cachorro: { breeds, savedAt }, ... }
const cacheStore = createJsonStore(STORAGE_KEYS.BREEDS, { fallback: {} });

// A lista guardada da espécie, se estiver no formato certo
async function readCached(species) {
  const cached = (await cacheStore.read())[species];
  return Array.isArray(cached?.breeds) ? cached : null;
}

// A lista foi guardada há menos de 30 dias
const isRecent = (cached) => Date.now() - cached.savedAt < MAX_AGE_MS;

// Baixa a lista da API e guarda no aparelho
async function download(species) {
  const breeds = await FETCHERS[species]();
  await cacheStore.update((cache) => ({
    ...cache,
    [species]: { breeds, savedAt: Date.now() },
  }));
  return breeds;
}

export const breedService = {
  // Raças da espécie. Usa a lista guardada enquanto ela tiver menos de 30
  // dias; depois, baixa de novo. Sem internet, fica com a lista guardada
  // (mesmo antiga) ou, sem nenhuma, devolve uma lista vazia.
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
