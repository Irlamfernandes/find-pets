// Registros que entram no mapa geral: pets ainda perdidos e com localização
export function getMappablePosts(posts) {
  return posts.filter(
    (post) =>
      (post.status || post.type) !== 'Encontrado' &&
      Number.isFinite(post.latitude) &&
      Number.isFinite(post.longitude)
  );
}
