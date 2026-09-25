import { useState, useEffect, useCallback } from 'react';
import { useCameraPermissions } from 'expo-camera';
import { Alert } from 'react-native';
import { postService } from '../services/postService';
import { locationService } from '../services/locationService';
import { onboardingService } from '../services/onboarding';
import { sessionService } from '../services/session';

export function useFeed() {
  const [posts, setPosts] = useState([]);
  const [userName, setUserName] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState(null);

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
      if (profile && profile.name) {
        setUserName(profile.name);
      }
    } catch {
      setUserName('');
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

  const openCamera = async () => {
    const hasPermission = cameraPermission?.granted === true;
    if (hasPermission) {
      setIsCameraOpen(true);
      return;
    }
    const permissionResult = await requestCameraPermission();
    if (permissionResult?.granted === true) {
      setIsCameraOpen(true);
    }
  };

  const closeCamera = () => {
    setIsCameraOpen(false);
  };

  const takePicture = async () => {
    if (!cameraRef) return;

    try {
      const photo = await cameraRef.takePictureAsync({ quality: 0.5 });
      const locationData = await locationService.getCurrentLocation();
      const userProfile = await onboardingService.getUserProfile();
      const session = await sessionService.getSession();

      const newPost = {
        id: Date.now().toString(),
        author: session?.usuario || null,
        imageUri: photo.uri,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        location: locationData.address,
        date: new Date().toLocaleDateString('pt-BR'),
        type: 'Perdido',
        status: 'Perdido',
        contactPhone: userProfile?.whatsapp || null,
      };

      await postService.savePost(newPost);
      await loadPosts();
      setIsCameraOpen(false);
    } catch {
      setIsCameraOpen(false);
      Alert.alert(
        'Erro',
        'Não foi possível capturar a foto ou obter a localização. Tente novamente.'
      );
    }
  };

  const markPostAsFound = async (postId) => {
    const post = posts.find((item) => item.id === postId);
    if (
      !post ||
      !currentUser ||
      post.author !== currentUser ||
      (post.status || post.type) === 'Encontrado'
    ) {
      return;
    }

    Alert.alert('Confirmar finalização', 'Este animal foi encontrado?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Finalizado',
        onPress: async () => {
          try {
            const updatedPosts = await postService.updatePostStatus(
              postId,
              'Encontrado'
            );
            setPosts(updatedPosts);
          } catch {
            Alert.alert(
              'Erro',
              'Não foi possível finalizar a publicação. Tente novamente.'
            );
          }
        },
      },
    ]);
  };

  // Função para excluir um post pelo ID com confirmação
  const deletePost = async (postId) => {
    const post = posts.find((item) => item.id === postId);
    if (!post || !currentUser || post.author !== currentUser) return;

    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza de que deseja excluir este registro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedPosts = await postService.deletePost(postId);
              setPosts(updatedPosts);
            } catch {
              Alert.alert(
                'Erro',
                'Não foi possível excluir a publicação. Tente novamente.'
              );
            }
          },
        },
      ]
    );
  };

  return {
    posts,
    userName,
    currentUser,
    isCameraOpen,
    setCameraRef,
    openCamera,
    closeCamera,
    takePicture,
    deletePost,
    markPostAsFound,
  };
}
