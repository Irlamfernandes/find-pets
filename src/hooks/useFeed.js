import { useState, useEffect, useCallback } from 'react';
import { postService } from '../services/postService';
import { postPhotoStorage } from '../services/photoStorage';
import { getPostImages } from '../utils/postImages';
import { onboardingService } from '../services/onboarding';
import { sessionService } from '../services/session';
import { useAppAlert } from '../components/AppAlert';

export function useFeed() {
  const showAlert = useAppAlert();
  const [posts, setPosts] = useState([]);
  const [userName, setUserName] = useState('');
  const [userPhoto, setUserPhoto] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [foundPostId, setFoundPostId] = useState(null);

  const loadPosts = useCallback(async () => {
    try {
      const loadedPosts = await postService.getPosts();
      setPosts(loadedPosts);
    } catch {
      setPosts([]);
    }
  }, []);

  const loadUserProfile = useCallback(async () => {
    try {
      const profile = await onboardingService.getUserProfile();
      if (profile?.name) {
        setUserName(profile.name);
      }
      setUserPhoto(profile?.photoUri || null);
    } catch {
      setUserName('');
      setUserPhoto(null);
    }
  }, []);

  const loadCurrentUser = useCallback(async () => {
    try {
      const session = await sessionService.getSession();
      setCurrentUser(session?.usuario || null);
    } catch {
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    loadPosts();
    loadUserProfile();
    loadCurrentUser();
  }, [loadPosts, loadUserProfile, loadCurrentUser]);

  // Abre o formulário do reencontro para o dono do registro
  const markPostAsFound = (postId) => {
    const post = posts.find((item) => item.id === postId);
    if (
      !post ||
      !currentUser ||
      post.author !== currentUser ||
      (post.status || post.type) === 'Encontrado'
    ) {
      return;
    }

    setFoundPostId(postId);
  };

  const cancelFound = () => {
    setFoundPostId(null);
  };

  const confirmFound = async (foundInfo) => {
    try {
      const updatedPosts = await postService.updatePostStatus(
        foundPostId,
        'Encontrado',
        { foundInfo }
      );
      setPosts(updatedPosts);
      setFoundPostId(null);
      showAlert({
        type: 'success',
        title: 'Que notícia boa!',
        message: 'O reencontro foi registrado e o card continuará no feed.',
      });
    } catch {
      showAlert({
        type: 'danger',
        title: 'Não foi possível salvar',
        message: 'Tente novamente em alguns instantes.',
      });
    }
  };

  // Função para excluir um post pelo ID com confirmação
  const deletePost = async (postId) => {
    const post = posts.find((item) => item.id === postId);
    if (!post || !currentUser || post.author !== currentUser) return;

    showAlert({
      type: 'danger',
      title: 'Confirmar Exclusão',
      message: 'Essa publicação será removida definitivamente do feed.',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          const updatedPosts = await postService.deletePost(postId);
          setPosts(updatedPosts);
          // Libera o espaço das fotos do registro excluído
          postPhotoStorage.removeAll(getPostImages(post));
        } catch {
          showAlert({
            type: 'danger',
            title: 'Não foi possível excluir',
            message: 'Tente novamente em alguns instantes.',
          });
        }
      },
    });
  };

  return {
    posts,
    userName,
    userPhoto,
    currentUser,
    deletePost,
    isFoundFormOpen: foundPostId !== null,
    markPostAsFound,
    cancelFound,
    confirmFound,
  };
}
