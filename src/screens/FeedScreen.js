import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Modal,
} from 'react-native';
import { CameraView } from 'expo-camera';
import PropTypes from 'prop-types';
import { useFeed } from '../hooks/useFeed';

export function FeedScreen({ onLogout }) {
  const {
    posts,
    isCameraOpen,
    setCameraRef,
    openCamera,
    closeCamera,
    takePicture,
  } = useFeed();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Pets - Feed</Text>
        {onLogout && (
          <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        )}
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
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.imageUri }} style={styles.cardImage} />
            <View style={styles.cardInfo}>
              <Text style={styles.cardBadge}>{item.type}</Text>
              <Text style={styles.cardDate}>Registrado em: {item.date}</Text>
            </View>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={openCamera}>
        <Text style={styles.fabText}>📷</Text>
      </TouchableOpacity>

      <Modal visible={isCameraOpen} animationType="slide">
        <View style={styles.cameraContainer}>
          <CameraView style={styles.camera} ref={setCameraRef}>
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
          </CameraView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

FeedScreen.propTypes = {
  onLogout: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  logoutButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#ff4d4d',
    borderRadius: 6,
  },
  logoutText: { color: '#fff', fontWeight: 'bold' },
  listContainer: { padding: 16 },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: '#666' },
  emptySubText: { fontSize: 14, color: '#999', marginTop: 4 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cardImage: { width: '100%', height: 250 },
  cardInfo: { padding: 12 },
  cardBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ff9800',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 6,
  },
  cardDate: { fontSize: 12, color: '#777' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabText: { fontSize: 24 },
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraButtonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    padding: 32,
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  captureInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#fff',
  },
  closeCameraButton: { padding: 12 },
  closeCameraText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
