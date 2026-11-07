import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { palette } from '../../../shared/theme/colors';
import { regionForPoints } from '../utils/mapRegion';

const SELECTED_COLOR = '#991B1B';

export function LostPetsMap({ posts, selectedId, onSelect, onClear }) {
  const initialRegion = useMemo(
    () => (posts.length > 0 ? regionForPoints(posts) : null),
    [posts]
  );

  if (posts.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="map-outline" size={36} color={palette.textMuted} />
        <Text style={styles.emptyText}>
          Nenhum pet perdido com localização registrada.
        </Text>
      </View>
    );
  }

  const handleMapPress = (event) => {
    if (event.nativeEvent.action !== 'marker-press') onClear();
  };

  return (
    <MapView
      testID="lost-pets-map"
      style={styles.map}
      initialRegion={initialRegion}
      onPress={handleMapPress}
      toolbarEnabled={false}
    >
      {posts.map((post) => {
        const isSelected = post.id === selectedId;
        return (
          <Marker
            key={`${post.id}-${isSelected}`}
            testID={`map-marker-${post.id}`}
            coordinate={{ latitude: post.latitude, longitude: post.longitude }}
            pinColor={isSelected ? SELECTED_COLOR : palette.error}
            tracksViewChanges={false}
            onPress={() => onSelect(post.id)}
          />
        );
      })}
    </MapView>
  );
}

LostPetsMap.propTypes = {
  posts: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  map: { flex: 1 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 15,
    color: palette.textMuted,
    textAlign: 'center',
  },
});
