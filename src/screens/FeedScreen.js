import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { useFeed } from '../hooks/useFeed';
import { externalLinkService } from '../services/externalLinkService';
import { PetCard } from './components/PetCard';
import { palette } from '../theme/colors';

export default function FeedScreen({
  onOpenProfile,
  openCameraOnMount,
  onCameraRequestHandled,
}) {
  const {
    posts,
    userName,
    isCameraOpen,
    setCameraRef,
    openCamera,
    closeCamera,
    takePicture,
    deletePost,
  } = useFeed();

  useEffect(() => {
    if (openCameraOnMount) {
      openCamera();
      onCameraRequestHandled?.();
    }
  }, [openCameraOnMount, openCamera, onCameraRequestHandled]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>FindPets</Text>
          {userName ? (
            <Text style={styles.welcomeText}>Olá, {userName}</Text>
          ) : null}
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum pet cadastrado ainda.</Text>
            <Text style={styles.emptySubText}>
              Toque na câmera para registrar o primeiro.
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <PetCard
            item={item}
            onOpenMap={(lat, lon, addr) =>
              externalLinkService.openMap(lat, lon, addr)
            }
            onOpenWhatsApp={(phone) => externalLinkService.openWhatsApp(phone)}
            onDelete={() => deletePost(item.id)}
          />
        )}
      />

      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.tabButton, styles.tabButtonActive]}>
          <Ionicons name="home-outline" size={22} color={palette.primary} />
          <Text style={styles.tabButtonText}>Feed</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabButton} onPress={openCamera}>
          <Ionicons name="camera-outline" size={22} color={palette.textMuted} />
          <Text style={styles.tabButtonText}>Camera</Text>
        </TouchableOpacity>

        {onOpenProfile && (
          <TouchableOpacity style={styles.tabButton} onPress={onOpenProfile}>
            <Ionicons
              name="person-outline"
              size={22}
              color={palette.textMuted}
            />
            <Text style={styles.tabButtonText}>Perfil</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={isCameraOpen} animationType="slide">
        <View style={styles.cameraContainer}>
          <CameraView style={styles.camera} ref={setCameraRef} />

          <View style={styles.cameraButtonContainer}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
            >
              <View style={styles.captureInner} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeCameraButton}
              onPress={closeCamera}
            >
              <Text style={styles.closeCameraText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

FeedScreen.propTypes = {
  onOpenProfile: PropTypes.func,
  openCameraOnMount: PropTypes.bool,
  onCameraRequestHandled: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.cardBorder,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: palette.text },
  welcomeText: { fontSize: 13, color: palette.textMuted, marginTop: 2 },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: palette.textMuted },
  emptySubText: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 18,
    paddingHorizontal: 16,
    backgroundColor: palette.surface,
    borderTopWidth: 1,
    borderTopColor: palette.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  tabButtonActive: {
    backgroundColor: palette.primarySoft,
  },
  tabButtonText: {
    color: palette.text,
    fontWeight: 'bold',
    fontSize: 12,
  },
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    padding: 32,
    alignItems: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  captureInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: palette.white,
  },
  closeCameraButton: { padding: 12 },
  closeCameraText: { color: palette.white, fontSize: 16, fontWeight: 'bold' },
});
