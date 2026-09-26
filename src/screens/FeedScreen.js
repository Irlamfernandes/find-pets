import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SafeTouchable } from '../components/SafeTouchable';
import { useFeed } from '../hooks/useFeed';
import { externalLinkService } from '../services/externalLinkService';
import { PetCard, getPostImages } from './components/PetCard';
import { PhotoViewerModal } from '../components/PhotoViewerModal';
import { MapViewerModal } from '../components/MapViewerModal';
import { FoundPetModal } from '../components/FoundPetModal';
import { UserAvatar } from '../components/UserAvatar';
import { FeedGuideCard } from '../components/FeedGuideCard';
import { useFeedGuide } from '../hooks/useFeedGuide';
import { useSharePost } from '../hooks/useSharePost';
import { SharePreviewModal } from '../components/SharePreviewModal';
import { LostPetsMap } from '../components/LostPetsMap';
import { MapPetSummary } from '../components/MapPetSummary';
import { getMappablePosts } from '../utils/mappablePosts';
import { palette } from '../theme/colors';

export default function FeedScreen({
  onOpenProfile,
  onOpenReport,
  onEditPost,
}) {
  const {
    posts,
    userName,
    userPhoto,
    currentUser,
    deletePost,
    isFoundFormOpen,
    markPostAsFound,
    cancelFound,
    confirmFound,
  } = useFeed();
  const [photoViewer, setPhotoViewer] = useState({ images: [], index: 0 });
  const [mapPost, setMapPost] = useState(null);
  const { isGuideVisible, dismissGuide, showGuide } = useFeedGuide(currentUser);
  const { sharingPost, openShare, closeShare, sharePoster } = useSharePost();
  // 'list' mostra os cards; 'map' mostra todos os pets perdidos no mapa
  const [viewMode, setViewMode] = useState('list');
  const [selectedMapPostId, setSelectedMapPostId] = useState(null);
  const mappablePosts = useMemo(() => getMappablePosts(posts), [posts]);
  const selectedMapPost =
    mappablePosts.find((post) => post.id === selectedMapPostId) || null;

  const changeViewMode = (mode) => {
    setSelectedMapPostId(null);
    setViewMode(mode);
  };

  const openPhotos = (post, index = 0) =>
    setPhotoViewer({ images: getPostImages(post), index });

  // Registros do próprio usuário que ainda não foram encontrados
  const isOwnActivePost = (post) =>
    post.author === currentUser && (post.status || post.type) !== 'Encontrado';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/adaptive-icon.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>FindPets</Text>
          {userName ? (
            <Text style={styles.welcomeText}>Olá, {userName}</Text>
          ) : null}
        </View>
        {isGuideVisible ? null : (
          <SafeTouchable
            accessibilityLabel="Como funciona o app"
            style={styles.helpButton}
            onPress={showGuide}
          >
            <Ionicons
              name="help-circle-outline"
              size={28}
              color={palette.primary}
            />
          </SafeTouchable>
        )}
        <UserAvatar
          uri={userPhoto}
          size={42}
          accessibilityLabel="Abrir meu perfil"
          onPress={onOpenProfile}
        />
      </View>

      <View style={styles.viewToggle}>
        {[
          { mode: 'list', label: 'Lista', icon: 'list-outline' },
          { mode: 'map', label: 'Mapa', icon: 'map-outline' },
        ].map((option) => {
          const active = viewMode === option.mode;
          return (
            <SafeTouchable
              key={option.mode}
              accessibilityState={{ selected: active }}
              style={[styles.toggleButton, active && styles.toggleActive]}
              onPress={() => changeViewMode(option.mode)}
            >
              <Ionicons
                name={option.icon}
                size={18}
                color={active ? palette.white : palette.primary}
              />
              <Text
                style={[styles.toggleText, active && styles.toggleTextActive]}
              >
                {option.label}
              </Text>
            </SafeTouchable>
          );
        })}
      </View>

      {viewMode === 'map' ? (
        <View style={styles.mapArea}>
          <LostPetsMap
            posts={mappablePosts}
            selectedId={selectedMapPostId}
            onSelect={setSelectedMapPostId}
            onClear={() => setSelectedMapPostId(null)}
          />
          {selectedMapPost ? (
            <View style={styles.mapSummary}>
              <MapPetSummary
                post={selectedMapPost}
                onClose={() => setSelectedMapPostId(null)}
                onOpenPhoto={() => openPhotos(selectedMapPost)}
                onOpenWhatsApp={(phone) =>
                  externalLinkService.openWhatsApp(phone)
                }
                onOpenRoute={() =>
                  externalLinkService.openRoute(
                    selectedMapPost.latitude,
                    selectedMapPost.longitude
                  )
                }
              />
            </View>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            isGuideVisible ? <FeedGuideCard onDismiss={dismissGuide} /> : null
          }
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <PetCard
              item={item}
              onOpenPhoto={(index) => openPhotos(item, index)}
              onOpenMap={() => setMapPost(item)}
              onOpenWhatsApp={(phone) =>
                externalLinkService.openWhatsApp(phone)
              }
              onOpenRoute={() =>
                externalLinkService.openRoute(item.latitude, item.longitude)
              }
              onShare={() => openShare(item)}
              onEdit={
                isOwnActivePost(item) && onEditPost
                  ? () => onEditPost(item)
                  : undefined
              }
              onDelete={
                item.author === currentUser
                  ? () => deletePost(item.id)
                  : undefined
              }
              onMarkFound={
                isOwnActivePost(item)
                  ? () => markPostAsFound(item.id)
                  : undefined
              }
            />
          )}
        />
      )}

      <View style={styles.bottomBar}>
        <SafeTouchable style={[styles.tabButton, styles.tabButtonActive]}>
          <Ionicons name="paw-outline" size={22} color={palette.primary} />
          <Text style={styles.tabButtonText}>Pets perdidos</Text>
        </SafeTouchable>

        <SafeTouchable style={styles.tabButton} onPress={onOpenReport}>
          <Ionicons
            name="megaphone-outline"
            size={22}
            color={palette.textMuted}
          />
          <Text style={styles.tabButtonText} numberOfLines={2}>
            Registrar desaparecimento
          </Text>
        </SafeTouchable>

        {onOpenProfile && (
          <SafeTouchable style={styles.tabButton} onPress={onOpenProfile}>
            <Ionicons
              name="person-outline"
              size={22}
              color={palette.textMuted}
            />
            <Text style={styles.tabButtonText}>Perfil</Text>
          </SafeTouchable>
        )}
      </View>

      <PhotoViewerModal
        images={photoViewer.images}
        initialIndex={photoViewer.index}
        onClose={() => setPhotoViewer({ images: [], index: 0 })}
      />

      <MapViewerModal post={mapPost} onClose={() => setMapPost(null)} />

      <SharePreviewModal
        post={sharingPost}
        onShare={sharePoster}
        onClose={closeShare}
      />

      <FoundPetModal
        visible={isFoundFormOpen}
        onCancel={cancelFound}
        onConfirm={confirmFound}
      />
    </SafeAreaView>
  );
}

FeedScreen.propTypes = {
  onOpenProfile: PropTypes.func,
  onOpenReport: PropTypes.func.isRequired,
  onEditPost: PropTypes.func,
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
  helpButton: { padding: 4, marginRight: 8 },
  headerLogo: {
    width: 34,
    height: 34,
    marginRight: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: palette.text },
  welcomeText: { fontSize: 13, color: palette.textMuted, marginTop: 2 },
  viewToggle: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.cardBorder,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.primary,
  },
  toggleActive: { backgroundColor: palette.primary },
  toggleText: { fontSize: 14, fontWeight: 'bold', color: palette.primary },
  toggleTextActive: { color: palette.white },
  // Espaço para a barra inferior, que fica por cima do conteúdo
  mapArea: { flex: 1, marginBottom: 88 },
  mapSummary: { position: 'absolute', left: 12, right: 12, bottom: 12 },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
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
    textAlign: 'center',
  },
});
