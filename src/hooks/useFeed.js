import { useState, useEffect, useCallback } from 'react';
import { useCameraPermissions } from 'expo-camera';
import { Alert } from 'react-native';
import { postService } from '../services/postService';
import { locationService } from '../services/locationService';
import { onboardingService } from '../services/onboarding';

export function useFeed() {
  const [posts, setPosts] = useState([]);
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

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

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

      const newPost = {
        id: Date.now().toString(),
        imageUri: photo.uri,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        location: locationData.address,
        date: new Date().toLocaleDateString('pt-BR'),
        type: 'Perdido',
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

  return {
    posts,
    isCameraOpen,
    setCameraRef,
    openCamera,
    closeCamera,
    takePicture,
  };
}
