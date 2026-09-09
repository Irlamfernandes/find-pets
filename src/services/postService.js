import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storageKeys';

export const postService = {
  async getPosts() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.POSTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      throw new Error(`Erro ao carregar as publicações: ${error.message}`);
    }
  },

  async savePost(post) {
    if (!post || !post.id) {
      throw new Error('Dados do post inválidos.');
    }

    try {
      const posts = await this.getPosts();
      const newPosts = [post, ...posts];
      await AsyncStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(newPosts));
      return newPosts;
    } catch (error) {
      throw new Error(`Erro ao salvar a publicação: ${error.message}`);
    }
  },
};
