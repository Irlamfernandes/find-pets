import { EMPTY_FILTER, filterPosts, isFiltering } from '../feedFilter';

const posts = [
  {
    id: '1',
    species: 'Cachorro',
    petName: 'Rex',
    breed: 'Vira-lata',
    color: 'Caramelo',
    location: 'Rua das Flores, São Paulo',
  },
  {
    id: '2',
    species: 'Gato',
    petName: 'Mimi',
    breed: 'Siamês',
    description: 'Coleira azul',
  },
  { id: '3', species: 'Outro', petName: 'Loro' },
];

const ids = (list) => list.map((post) => post.id);

describe('feedFilter', () => {
  it('deve mostrar todos os registros sem filtro', () => {
    expect(ids(filterPosts(posts, EMPTY_FILTER))).toEqual(['1', '2', '3']);
    expect(isFiltering(EMPTY_FILTER)).toBe(false);
    expect(isFiltering({ species: '', text: '   ' })).toBe(false);
  });

  it('deve filtrar pela espécie', () => {
    expect(ids(filterPosts(posts, { species: 'Gato', text: '' }))).toEqual([
      '2',
    ]);
    expect(isFiltering({ species: 'Gato', text: '' })).toBe(true);
  });

  it('deve buscar no nome, raça, cor, descrição e lugar sem acentos', () => {
    const search = (text) => ids(filterPosts(posts, { species: '', text }));

    expect(search('rex')).toEqual(['1']);
    expect(search('SIAMES')).toEqual(['2']);
    expect(search('caramelo')).toEqual(['1']);
    expect(search('coleira')).toEqual(['2']);
    expect(search('sao paulo')).toEqual(['1']);
    expect(search('nada disso')).toEqual([]);
    expect(isFiltering({ species: '', text: 'rex' })).toBe(true);
  });

  it('deve combinar espécie e texto', () => {
    expect(filterPosts(posts, { species: 'Gato', text: 'rex' })).toEqual([]);
  });
});
