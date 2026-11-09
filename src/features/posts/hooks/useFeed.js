import { useState, useEffect } from 'react';
import { postService } from '../services/postService';
import { isFound, isOwnedBy, markAsFound } from '../domain/post';
import { profileService } from '../../profile/services/profileService';
import { sessionService } from '../../auth/services/sessionService';
import { useAppAlert } from '../../../shared/components/AppAlert';
import { useBusy } from '../../../shared/components/BusyOverlay';
import { SYNC_RESULT, syncService } from '../../sync/syncService';

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

const orDefault = (promise, fallback) => promise.catch(() => fallback);

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
  const track = useBusy();
  const [posts, setPosts] = useState([]);
  const [viewer, setViewer] = useState(EMPTY_VIEWER);
  const [foundPostId, setFoundPostId] = useState(null);

  useEffect(() => {
    const load = () => {
      orDefault(postService.getPosts(), []).then(setPosts);
      loadViewer().then(setViewer);
    };
    load();
    return syncService.subscribe((result) => {
      if (result === SYNC_RESULT.SYNCED) load();
    });
  }, []);

  const findOwnPost = (postId) =>
    posts.find((post) => post.id === postId && isOwnedBy(post, viewer.usuario));

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
      setPosts(await track(postService.deletePost(post.id)));
    } catch {
      showAlert(ALERTS.deleteFailed);
    }
  };

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
    foundPost: posts.find((post) => post.id === foundPostId) || null,
    markPostAsFound,
    cancelFound: () => setFoundPostId(null),
    confirmFound,
  };
}
