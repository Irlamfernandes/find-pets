import { breedsApi } from '../breedsApi';

// Resposta de sucesso com o JSON informado
const okResponse = (body) => ({ ok: true, json: async () => body });

describe('breedsApi (APIs públicas de raças)', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    delete global.fetch;
  });

  it('deve buscar as raças de cachorro na Dog CEO', async () => {
    fetch.mockResolvedValueOnce(
      okResponse({ message: { pug: [], hound: ['afghan'] }, status: 'success' })
    );

    await expect(breedsApi.fetchDogBreeds()).resolves.toEqual([
      'Pug',
      'Hound',
      'Afghan Hound',
    ]);
    expect(fetch).toHaveBeenCalledWith(
      'https://dog.ceo/api/breeds/list/all',
      expect.objectContaining({ signal: expect.any(Object) })
    );
  });

  it('deve buscar as raças de gato na Cat Facts', async () => {
    fetch.mockResolvedValueOnce(
      okResponse({ data: [{ breed: 'Siamese' }, { breed: 'Persian' }] })
    );

    await expect(breedsApi.fetchCatBreeds()).resolves.toEqual([
      'Siamese',
      'Persian',
    ]);
    expect(fetch.mock.calls[0][0]).toBe(
      'https://catfact.ninja/breeds?limit=200'
    );
  });

  it('deve falhar quando a API responde com erro', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 503 });

    await expect(breedsApi.fetchDogBreeds()).rejects.toThrow(
      'Resposta 503 de https://dog.ceo/api/breeds/list/all'
    );
  });

  it('deve desistir quando a API demora demais', async () => {
    jest.useFakeTimers();
    // A busca só termina quando é cancelada
    fetch.mockImplementationOnce(
      (_url, { signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new Error('abortado')));
        })
    );

    const request = breedsApi.fetchCatBreeds();
    jest.advanceTimersByTime(10000);

    await expect(request).rejects.toThrow('abortado');
  });
});
