import { renderHook, act } from '@testing-library/react-native';
import { useBreedSuggestions } from '../useBreedSuggestions';
import { breedService } from '../../services/breedService';

jest.mock('../../services/breedService', () => ({
  breedService: { getBreeds: jest.fn() },
}));

const renderSuggestions = async (species, text) =>
  await renderHook((props) => useBreedSuggestions(props.species, props.text), {
    initialProps: { species, text },
  });

describe('useBreedSuggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    breedService.getBreeds.mockImplementation(async (species) =>
      species === 'Gato' ? ['Siamese', 'Persian'] : ['Pug', 'Puli']
    );
  });

  it('deve sugerir raças da espécie a partir de 2 letras', async () => {
    const { result, rerender } = await renderSuggestions('Cachorro', 'p');
    await act(async () => {});
    expect(breedService.getBreeds).not.toHaveBeenCalled();
    expect(result.current).toEqual([]);

    await rerender({ species: 'Cachorro', text: 'pu' });
    await act(async () => {});
    expect(breedService.getBreeds).toHaveBeenCalledWith('Cachorro');
    expect(result.current).toEqual(['Pug', 'Puli']);

    await rerender({ species: 'Cachorro', text: 'pug' });
    await act(async () => {});
    expect(breedService.getBreeds).toHaveBeenCalledTimes(1);
  });

  it('deve trocar a lista ao trocar de espécie, sem misturar as raças', async () => {
    const { result, rerender } = await renderSuggestions('Cachorro', 'pe');
    await act(async () => {});
    expect(result.current).toEqual([]);

    let finish;
    breedService.getBreeds.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    await rerender({ species: 'Gato', text: 'pe' });
    expect(result.current).toEqual([]);
    await act(async () => finish(['Siamese', 'Persian']));
    expect(result.current).toEqual(['Persian']);
  });

  it('não deve buscar para outras espécies nem sem texto', async () => {
    const { result } = await renderHook(() => useBreedSuggestions('Outro'));
    await act(async () => {});

    expect(result.current).toEqual([]);
    expect(breedService.getBreeds).not.toHaveBeenCalled();
  });

  it('deve ficar sem sugestões se a busca falhar', async () => {
    breedService.getBreeds.mockRejectedValueOnce(new Error('x'));
    const { result } = await renderSuggestions('Cachorro', 'pu');
    await act(async () => {});

    expect(result.current).toEqual([]);
  });

  it('deve ignorar a resposta que chega depois de sair da tela', async () => {
    let finish;
    breedService.getBreeds.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    const { result, unmount } = await renderSuggestions('Cachorro', 'pu');
    await unmount();

    await act(async () => finish(['Pug']));
    expect(result.current).toEqual([]);
  });
});
