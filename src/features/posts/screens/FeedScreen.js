import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PropTypes from 'prop-types';
import { useFeed } from '../hooks/useFeed';
import { useFeedGuide } from '../hooks/useFeedGuide';
import { useSharePost } from '../hooks/useSharePost';
import { useFeedFilter } from '../hooks/useFeedFilter';
import { PetList } from '../components/PetList';
import { FoundPetModal } from '../components/FoundPetModal';
import { FeedGuideCard } from '../components/FeedGuideCard';
import { FeedHeader } from '../components/FeedHeader';
import { FeedFilters, FilterEmptyState } from '../components/FeedFilters';
import { OfflineBanner } from '../../../shared/components/OfflineBanner';
import { ViewModeToggle } from '../components/ViewModeToggle';
import { SharePreviewModal } from '../components/SharePreviewModal';
import { LostPetsMapView } from '../../map/components/LostPetsMapView';
import { MapViewerModal } from '../../map/components/MapViewerModal';
import { PhotoViewerModal } from '../../../shared/components/PhotoViewerModal';
import { BottomTabBar } from '../../../shared/components/BottomTabBar';
import { externalLinkService } from '../../../shared/services/externalLinkService';
import { palette } from '../../../shared/theme/colors';

const openWhatsApp = (phone) => externalLinkService.openWhatsApp(phone);
const openRoute = (post) =>
  externalLinkService.openRoute(post.latitude, post.longitude);

function FeedOverlays({
  feed,
  sharing,
  photoViewer,
  onClosePhotos,
  mapPost,
  onCloseMap,
}) {
  return (
    <>
      <PhotoViewerModal
        images={photoViewer.images}
        initialIndex={photoViewer.index}
        onClose={onClosePhotos}
      />

      <MapViewerModal post={mapPost} onClose={onCloseMap} />

      <SharePreviewModal
        post={sharing.sharingPost}
        onShare={sharing.sharePoster}
        onClose={sharing.closeShare}
      />

      <FoundPetModal
        visible={feed.isFoundFormOpen}
        lostAt={feed.foundPost?.occurredAt}
        onCancel={feed.cancelFound}
        onConfirm={feed.confirmFound}
      />
    </>
  );
}

FeedOverlays.propTypes = {
  feed: PropTypes.object.isRequired,
  sharing: PropTypes.object.isRequired,
  photoViewer: PropTypes.object.isRequired,
  onClosePhotos: PropTypes.func.isRequired,
  mapPost: PropTypes.object,
  onCloseMap: PropTypes.func.isRequired,
};

export default function FeedScreen({
  onOpenProfile,
  onOpenReport,
  onEditPost,
}) {
  const feed = useFeed();
  const { currentUser } = feed;
  const filter = useFeedFilter(feed.posts);
  const { posts } = filter;
  const [photoViewer, setPhotoViewer] = useState({ images: [], index: 0 });
  const [mapPost, setMapPost] = useState(null);
  const guide = useFeedGuide(currentUser);
  const { sharingPost, openShare, closeShare, sharePoster } = useSharePost();
  const [viewMode, setViewMode] = useState('list');

  const openPhotos = (post, index = 0) =>
    setPhotoViewer({ images: post.images, index });

  return (
    <SafeAreaView style={styles.container}>
      <FeedHeader
        userName={feed.userName}
        userPhoto={feed.userPhoto}
        onShowGuide={guide.isGuideVisible ? undefined : guide.showGuide}
        onOpenProfile={onOpenProfile}
      />

      <OfflineBanner />
      <ViewModeToggle value={viewMode} onChange={setViewMode} />
      <FeedFilters
        species={filter.species}
        text={filter.text}
        onChangeSpecies={filter.setSpecies}
        onChangeText={filter.setText}
      />

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
          empty={
            filter.isFiltering ? (
              <FilterEmptyState onClear={filter.clear} />
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

      <FeedOverlays
        feed={feed}
        sharing={{ sharingPost, sharePoster, closeShare }}
        photoViewer={photoViewer}
        onClosePhotos={() => setPhotoViewer({ images: [], index: 0 })}
        mapPost={mapPost}
        onCloseMap={() => setMapPost(null)}
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
