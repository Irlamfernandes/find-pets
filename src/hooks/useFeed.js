import { useState, useEffect, useCallback } from 'react';
import { useCameraPermissions } from 'expo-camera';
import { postService } from '../services/postService';
import { locationService } from '../services/locationService';

export function useFeed() {
  const [posts, setPosts] = useState([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState(null);

  const loadPosts = useCallback(async () => {
    const loadedPosts = await postService.getPosts();
    setPosts(loadedPosts);
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

      const newPost = {
        id: Date.now().toString(),
        imageUri: photo.uri,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        location: locationData.address,
        date: new Date().toLocaleDateString('pt-BR'),
        type: 'Perdido',
      };

      await postService.savePost(newPost);
      await loadPosts();
      setIsCameraOpen(false);
    } catch {
      // Tratamento de erro na captura
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
