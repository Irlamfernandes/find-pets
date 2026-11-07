import { isFound, hasCoordinates } from '../domain/post';

export function getMappablePosts(posts) {
  return posts.filter((post) => !isFound(post) && hasCoordinates(post));
}
