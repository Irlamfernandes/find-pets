import {
  readChangedSince,
  readValue,
  writeValue,
} from '../../../shared/firebase/realtimeDatabase';

const POSTS = 'posts';
const pathOf = (id) => `${POSTS}/${id}`;

const withImages = (post) => ({ ...post, images: post.images ?? [] });

export const postsApi = {
  async listChangedSince(since) {
    return (await readChangedSince(POSTS, since)).map(withImages);
  },

  async save(post) {
    const current = await readValue(pathOf(post.id));
    if (current && current.updatedAt > post.updatedAt) {
      return withImages(current);
    }
    await writeValue(pathOf(post.id), post);
    return post;
  },
};
