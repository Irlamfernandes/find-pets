import { STORAGE_KEYS } from '../../../shared/constants/storageKeys';
import {
  createJsonStore,
  withErrorContext,
} from '../../../shared/services/storage';

// Registros sem id (ou que nem são objetos) não podem ser exibidos
const isValidPost = (post) =>
  post !== null && typeof post === 'object' && Boolean(post.id);

// Registros de pets, do mais novo para o mais antigo
const postsStore = createJsonStore(STORAGE_KEYS.POSTS, {
  fallback: [],
  normalize: (posts) => posts.filter(isValidPost),
});

function requireId(postId) {
  if (!postId) {
    throw new Error('ID da publicação é obrigatório.');
  }
}

export const postService = {
  getPosts() {
    return withErrorContext('Erro ao carregar as publicações', postsStore.read);
  },

  // Devolve a lista atualizada
  savePost(post) {
    if (!post?.id) {
      throw new Error('Dados do post inválidos.');
    }
    return withErrorContext('Erro ao salvar a publicação', () =>
      postsStore.update((posts) => [post, ...posts])
    );
  },

  deletePost(postId) {
    requireId(postId);
    return withErrorContext('Erro ao excluir a publicação', () =>
      postsStore.update((posts) => posts.filter((post) => post.id !== postId))
    );
  },

  // Aplica `changes` ao registro, mantendo o id
  updatePost(postId, changes) {
    requireId(postId);
    return withErrorContext('Erro ao atualizar a publicação', () =>
      postsStore.update((posts) =>
        posts.map((post) =>
          post.id === postId ? { ...post, ...changes, id: post.id } : post
        )
      )
    );
  },
};
