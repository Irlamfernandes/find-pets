import AsyncStorage from '@react-native-async-storage/async-storage';

const POSTS_KEY = '@FindPets:posts';

export const postService = {
  async getPosts() {
    try {
      const data = await AsyncStorage.getItem(POSTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async savePost(post) {
    try {
      const posts = await this.getPosts();
      const newPosts = [post, ...posts];
      await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(newPosts));
      return newPosts;
    } catch {
      throw new Error('Erro ao salvar a publicação.');
    }
  },
};
