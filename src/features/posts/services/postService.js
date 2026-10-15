import { inTransaction } from '../../../shared/database/connection';
import { withErrorContext } from '../../../shared/services/storage';
import { postRepository } from '../data/postRepository';
import { requestSync } from '../../../shared/services/syncScheduler';

function requireId(postId) {
  if (!postId) {
    throw new Error('ID da publicação é obrigatório.');
  }
}

// Depois de gravar no celular, pede o envio para o servidor (se houver
// internet) e devolve a lista atualizada
async function afterChange() {
  requestSync();
  return postRepository.findActive();
}

// Registros de pets, do mais novo para o mais antigo. Cada alteração
// devolve a lista atualizada.
export const postService = {
  getPosts() {
    return withErrorContext('Erro ao carregar as publicações', () =>
      postRepository.findActive()
    );
  },

  savePost(post) {
    if (!post?.id) {
      throw new Error('Dados do post inválidos.');
    }
    return withErrorContext('Erro ao salvar a publicação', async () => {
      await inTransaction(() => postRepository.insert(post));
      return afterChange();
    });
  },

  // Exclusão lógica: some do feed, mas continua no banco como histórico
  deletePost(postId) {
    requireId(postId);
    return withErrorContext('Erro ao excluir a publicação', async () => {
      await postRepository.softDelete(postId);
      return afterChange();
    });
  },

  // Aplica `changes` ao registro, mantendo o id
  updatePost(postId, changes) {
    requireId(postId);
    return withErrorContext('Erro ao atualizar a publicação', async () => {
      await inTransaction(() => postRepository.update(postId, changes));
      return afterChange();
    });
  },
};
