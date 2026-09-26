import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { LostPetsMap } from './LostPetsMap';
import { MapPetSummary } from './MapPetSummary';
import { getMappablePosts } from '../../posts/utils/mappablePosts';

// Mapa com todos os pets perdidos; tocar em um ponto mostra o resumo dele
export function LostPetsMapView({
  posts,
  onOpenPhoto,
  onOpenWhatsApp,
  onOpenRoute,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const mappablePosts = useMemo(() => getMappablePosts(posts), [posts]);
  const selectedPost =
    mappablePosts.find((post) => post.id === selectedId) || null;
  const clearSelection = () => setSelectedId(null);

  return (
    <View style={styles.area}>
      <LostPetsMap
        posts={mappablePosts}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onClear={clearSelection}
      />
      {selectedPost ? (
        <View style={styles.summary}>
          <MapPetSummary
            post={selectedPost}
            onClose={clearSelection}
            onOpenPhoto={() => onOpenPhoto(selectedPost)}
            onOpenWhatsApp={onOpenWhatsApp}
            onOpenRoute={() => onOpenRoute(selectedPost)}
          />
        </View>
      ) : null}
    </View>
  );
}

LostPetsMapView.propTypes = {
  posts: PropTypes.arrayOf(PropTypes.object).isRequired,
  onOpenPhoto: PropTypes.func.isRequired,
  onOpenWhatsApp: PropTypes.func.isRequired,
  onOpenRoute: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  // Espaço para a barra inferior, que fica por cima do conteúdo
  area: { flex: 1, marginBottom: 88 },
  summary: { position: 'absolute', left: 12, right: 12, bottom: 12 },
});
