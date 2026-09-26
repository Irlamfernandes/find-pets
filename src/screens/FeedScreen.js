import React, { useState } from 'react';
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
import { palette } from '../theme/colors';

export default function FeedScreen({ onOpenProfile, onOpenReport }) {
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
            onOpenPhoto={(index) =>
              setPhotoViewer({ images: getPostImages(item), index })
            }
            onOpenMap={() => setMapPost(item)}
            onOpenWhatsApp={(phone) => externalLinkService.openWhatsApp(phone)}
            onOpenRoute={() =>
              externalLinkService.openRoute(item.latitude, item.longitude)
            }
            onDelete={
              item.author === currentUser
                ? () => deletePost(item.id)
                : undefined
            }
            onMarkFound={
              item.author === currentUser &&
              (item.status || item.type) !== 'Encontrado'
                ? () => markPostAsFound(item.id)
                : undefined
            }
          />
        )}
      />

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
