import { isFound, hasCoordinates } from '../domain/post';

// Registros que entram no mapa geral: pets ainda perdidos e com localização
export function getMappablePosts(posts) {
  return posts.filter((post) => !isFound(post) && hasCoordinates(post));
}
