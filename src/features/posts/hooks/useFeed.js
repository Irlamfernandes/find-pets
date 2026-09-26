import { useState, useEffect } from 'react';
import { postService } from '../services/postService';
import { postPhotoStorage } from '../../../shared/services/photoStorage';
import { getPostImages } from '../utils/postImages';
import { isFound, isOwnedBy, markAsFound } from '../domain/post';
import { profileService } from '../../profile/services/profileService';
import { sessionService } from '../../auth/services/sessionService';
import { useAppAlert } from '../../../shared/components/AppAlert';

const ALERTS = {
  foundSaved: {
    type: 'success',
    title: 'Que notícia boa!',
    message: 'O reencontro foi registrado e o card continuará no feed.',
  },
  foundFailed: {
    type: 'danger',
    title: 'Não foi possível salvar',
    message: 'Tente novamente em alguns instantes.',
  },
  deleteFailed: {
    type: 'danger',
    title: 'Não foi possível excluir',
    message: 'Tente novamente em alguns instantes.',
  },
};

const EMPTY_VIEWER = { usuario: null, name: '', photoUri: null };

// Falhas na leitura não impedem o feed de abrir
const orDefault = (promise, fallback) => promise.catch(() => fallback);

// Quem está usando o app: conta conectada, nome e foto do perfil
async function loadViewer() {
  const [usuario, profile] = await Promise.all([
    orDefault(sessionService.getCurrentUser(), null),
    orDefault(profileService.getProfile(), null),
  ]);
  return {
    usuario,
    name: profile?.name || '',
    photoUri: profile?.photoUri || null,
  };
}

export function useFeed() {
  const showAlert = useAppAlert();
  const [posts, setPosts] = useState([]);
  const [viewer, setViewer] = useState(EMPTY_VIEWER);
  const [foundPostId, setFoundPostId] = useState(null);

  useEffect(() => {
    orDefault(postService.getPosts(), []).then(setPosts);
    loadViewer().then(setViewer);
  }, []);

  // Só o autor pode alterar o próprio registro
  const findOwnPost = (postId) =>
    posts.find((post) => post.id === postId && isOwnedBy(post, viewer.usuario));

  // Abre o formulário do reencontro
  const markPostAsFound = (postId) => {
    const post = findOwnPost(postId);
    if (post && !isFound(post)) setFoundPostId(postId);
  };

  const confirmFound = async (foundInfo) => {
    try {
      setPosts(
        await postService.updatePost(foundPostId, markAsFound(foundInfo))
      );
      setFoundPostId(null);
      showAlert(ALERTS.foundSaved);
    } catch {
      showAlert(ALERTS.foundFailed);
    }
  };

  const removePost = async (post) => {
    try {
      setPosts(await postService.deletePost(post.id));
      // Libera o espaço das fotos do registro excluído
      postPhotoStorage.removeAll(getPostImages(post));
    } catch {
      showAlert(ALERTS.deleteFailed);
    }
  };

  // Pede confirmação antes de excluir
  const deletePost = (postId) => {
    const post = findOwnPost(postId);
    if (!post) return;

    showAlert({
      type: 'danger',
      title: 'Confirmar Exclusão',
      message: 'Essa publicação será removida definitivamente do feed.',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      onConfirm: () => removePost(post),
    });
  };

  return {
    posts,
    userName: viewer.name,
    userPhoto: viewer.photoUri,
    currentUser: viewer.usuario,
    deletePost,
    isFoundFormOpen: foundPostId !== null,
    // Registro que está sendo marcado como encontrado
    foundPost: posts.find((post) => post.id === foundPostId) || null,
    markPostAsFound,
    cancelFound: () => setFoundPostId(null),
    confirmFound,
  };
}
