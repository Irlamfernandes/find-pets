import AsyncStorage from 'expo-sqlite/kv-store';
import { breedService } from '../breedService';
import { breedsApi } from '../../api/breedsApi';
import { STORAGE_KEYS } from '../../../../shared/constants/storageKeys';

jest.mock('../../api/breedsApi', () => ({
  breedsApi: { fetchDogBreeds: jest.fn(), fetchCatBreeds: jest.fn() },
}));

const DAY_MS = 24 * 60 * 60 * 1000;

const saveCache = (species, breeds, daysAgo) =>
  AsyncStorage.setItem(
    STORAGE_KEYS.BREEDS,
    JSON.stringify({
      [species]: { breeds, savedAt: Date.now() - daysAgo * DAY_MS },
    })
  );

describe('breedService', () => {
  beforeEach(() => {
    AsyncStorage.__backend.reset();
    jest.clearAllMocks();
  });

  it('deve baixar e guardar as raças de cachorro e de gato', async () => {
    breedsApi.fetchDogBreeds.mockResolvedValueOnce(['Pug']);
    breedsApi.fetchCatBreeds.mockResolvedValueOnce(['Siamese']);

    await expect(breedService.getBreeds('Cachorro')).resolves.toEqual(['Pug']);
    await expect(breedService.getBreeds('Gato')).resolves.toEqual(['Siamese']);

    const saved = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.BREEDS));
    expect(saved.Cachorro.breeds).toEqual(['Pug']);
    expect(saved.Gato.breeds).toEqual(['Siamese']);
  });

  it('deve usar a lista guardada sem chamar a API enquanto for recente', async () => {
    await saveCache('Cachorro', ['Beagle'], 29);

    await expect(breedService.getBreeds('Cachorro')).resolves.toEqual([
      'Beagle',
    ]);
    expect(breedsApi.fetchDogBreeds).not.toHaveBeenCalled();
  });

  it('deve baixar de novo a lista com mais de 30 dias', async () => {
    await saveCache('Cachorro', ['Beagle'], 31);
    breedsApi.fetchDogBreeds.mockResolvedValueOnce(['Beagle', 'Pug']);

    await expect(breedService.getBreeds('Cachorro')).resolves.toEqual([
      'Beagle',
      'Pug',
    ]);
  });

  it('sem internet, deve ficar com a lista antiga ou com nenhuma', async () => {
    breedsApi.fetchDogBreeds.mockRejectedValue(new Error('offline'));

    await expect(breedService.getBreeds('Cachorro')).resolves.toEqual([]);

    await saveCache('Cachorro', ['Beagle'], 40);
    await expect(breedService.getBreeds('Cachorro')).resolves.toEqual([
      'Beagle',
    ]);
  });

  it('deve ignorar a lista guardada em formato errado', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.BREEDS,
      JSON.stringify({ Cachorro: { breeds: 'Pug' } })
    );
    breedsApi.fetchDogBreeds.mockResolvedValueOnce(['Pug']);

    await expect(breedService.getBreeds('Cachorro')).resolves.toEqual(['Pug']);
  });

  it('não deve buscar raças de outras espécies', async () => {
    await expect(breedService.getBreeds('Outro')).resolves.toEqual([]);
    await expect(breedService.getBreeds('')).resolves.toEqual([]);
    expect(breedsApi.fetchDogBreeds).not.toHaveBeenCalled();
  });
});
