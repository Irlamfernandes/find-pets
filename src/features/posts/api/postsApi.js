import {
  readChangedSince,
  readValue,
  writeValue,
} from '../../../shared/firebase/realtimeDatabase';

// Registros de todos os usuários no Realtime Database: posts/<id>
const POSTS = 'posts';
// Caminho de um registro no banco
const pathOf = (id) => `${POSTS}/${id}`;

// O banco não guarda campos vazios: lista de fotos vazia some
const withImages = (post) => ({ ...post, images: post.images ?? [] });

export const postsApi = {
  // O que mudou na nuvem a partir de `since` (inclusive exclusões)
  async listChangedSince(since) {
    return (await readChangedSince(POSTS, since)).map(withImages);
  },

  // Cria ou atualiza e devolve o registro como ficou na nuvem. Vale a
  // alteração mais recente: se a nuvem já tem uma versão mais nova (feita
  // em outro celular), ela é mantida.
  async save(post) {
    const current = await readValue(pathOf(post.id));
    if (current && current.updatedAt > post.updatedAt) {
      return withImages(current);
    }
    await writeValue(pathOf(post.id), post);
    return post;
  },
};
