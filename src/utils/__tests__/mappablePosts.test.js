import { getMappablePosts } from '../mappablePosts';

describe('getMappablePosts', () => {
  it('deve manter só pets perdidos com localização', () => {
    const posts = [
      { id: '1', status: 'Perdido', latitude: 1, longitude: 2 },
      { id: '2', status: 'Encontrado', latitude: 1, longitude: 2 },
      { id: '3', type: 'Perdido', latitude: null, longitude: 2 },
      { id: '4', type: 'Perdido', latitude: 3, longitude: 4 },
    ];

    expect(getMappablePosts(posts).map((post) => post.id)).toEqual(['1', '4']);
  });
});
