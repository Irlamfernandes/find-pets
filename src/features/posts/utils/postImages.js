// Registros antigos tinham apenas uma foto em imageUri
export function getPostImages(post) {
  return post.images?.length ? post.images : [post.imageUri];
}
