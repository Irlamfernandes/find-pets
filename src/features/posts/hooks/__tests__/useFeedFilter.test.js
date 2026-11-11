import { renderHook, act } from '@testing-library/react-native';
import { useFeedFilter } from '../useFeedFilter';

const posts = [
  { id: '1', species: 'Cachorro', petName: 'Rex' },
  { id: '2', species: 'Gato', petName: 'Mimi' },
];

describe('useFeedFilter', () => {
  it('deve começar sem filtro e filtrar pela espécie e pelo texto', async () => {
    const { result } = await renderHook(() => useFeedFilter(posts));
    expect(result.current.species).toBe('Todos');
    expect(result.current.isFiltering).toBe(false);
    expect(result.current.posts).toHaveLength(2);

    await act(async () => result.current.setSpecies('Gato'));
    expect(result.current.species).toBe('Gato');
    expect(result.current.posts.map((post) => post.id)).toEqual(['2']);

    await act(async () => result.current.setText('rex'));
    expect(result.current.text).toBe('rex');
    expect(result.current.posts).toEqual([]);
    expect(result.current.isFiltering).toBe(true);

    await act(async () => result.current.setSpecies('Todos'));
    expect(result.current.posts.map((post) => post.id)).toEqual(['1']);

    await act(async () => result.current.clear());
    expect(result.current.species).toBe('Todos');
    expect(result.current.text).toBe('');
    expect(result.current.posts).toHaveLength(2);
  });
});
