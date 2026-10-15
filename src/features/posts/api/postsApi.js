import { request } from '../../../shared/api/httpClient';

// Rotas de registros da API
export const postsApi = {
  // O que mudou no servidor a partir de `since` (inclusive exclusões)
  listChangedSince(token, since) {
    const query = encodeURIComponent(since);
    return request(`/posts?since=${query}`, { token });
  },

  // Cria ou atualiza; devolve o registro como ficou no servidor
  save(token, post) {
    return request(`/posts/${post.id}`, { method: 'PUT', body: post, token });
  },
};
