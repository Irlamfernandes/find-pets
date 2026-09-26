import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PropTypes from 'prop-types';
import { useFeed } from '../hooks/useFeed';
import { useFeedGuide } from '../hooks/useFeedGuide';
import { useSharePost } from '../hooks/useSharePost';
import { getPostImages } from '../utils/postImages';
import { PetList } from '../components/PetList';
import { FoundPetModal } from '../components/FoundPetModal';
import { FeedGuideCard } from '../components/FeedGuideCard';
import { FeedHeader } from '../components/FeedHeader';
import { ViewModeToggle } from '../components/ViewModeToggle';
import { SharePreviewModal } from '../components/SharePreviewModal';
import { LostPetsMapView } from '../../map/components/LostPetsMapView';
import { MapViewerModal } from '../../map/components/MapViewerModal';
import { PhotoViewerModal } from '../../../shared/components/PhotoViewerModal';
import { BottomTabBar } from '../../../shared/components/BottomTabBar';
import { externalLinkService } from '../../../shared/services/externalLinkService';
import { palette } from '../../../shared/theme/colors';

// Abre o WhatsApp e a rota no app de mapas do celular
const openWhatsApp = (phone) => externalLinkService.openWhatsApp(phone);
const openRoute = (post) =>
  externalLinkService.openRoute(post.latitude, post.longitude);

export default function FeedScreen({
  onOpenProfile,
  onOpenReport,
  onEditPost,
}) {
  const feed = useFeed();
  const { posts, currentUser } = feed;
  const [photoViewer, setPhotoViewer] = useState({ images: [], index: 0 });
  const [mapPost, setMapPost] = useState(null);
  const guide = useFeedGuide(currentUser);
  const { sharingPost, openShare, closeShare, sharePoster } = useSharePost();
  // 'list' mostra os cards; 'map' mostra todos os pets perdidos no mapa
  const [viewMode, setViewMode] = useState('list');

  const openPhotos = (post, index = 0) =>
    setPhotoViewer({ images: getPostImages(post), index });

  return (
    <SafeAreaView style={styles.container}>
      <FeedHeader
        userName={feed.userName}
        userPhoto={feed.userPhoto}
        onShowGuide={guide.isGuideVisible ? undefined : guide.showGuide}
        onOpenProfile={onOpenProfile}
      />

      <ViewModeToggle value={viewMode} onChange={setViewMode} />

      {viewMode === 'map' ? (
        <LostPetsMapView
          posts={posts}
          onOpenPhoto={openPhotos}
          onOpenWhatsApp={openWhatsApp}
          onOpenRoute={openRoute}
        />
      ) : (
        <PetList
          posts={posts}
          currentUser={currentUser}
          header={
            guide.isGuideVisible ? (
              <FeedGuideCard onDismiss={guide.dismissGuide} />
            ) : null
          }
          onOpenPhoto={openPhotos}
          onOpenMap={setMapPost}
          onOpenWhatsApp={openWhatsApp}
          onOpenRoute={openRoute}
          onShare={openShare}
          ownerHandlers={{
            onEdit: onEditPost,
            onDelete: feed.deletePost,
            onMarkFound: feed.markPostAsFound,
          }}
        />
      )}

      <BottomTabBar
        active="feed"
        onNavigate={{ report: onOpenReport, profile: onOpenProfile }}
      />

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
        visible={feed.isFoundFormOpen}
        lostAt={feed.foundPost?.occurredAt}
        onCancel={feed.cancelFound}
        onConfirm={feed.confirmFound}
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
});
