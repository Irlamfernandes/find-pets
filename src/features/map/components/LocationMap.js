import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { palette } from '../../../shared/theme/colors';
import { regionAround } from '../utils/mapRegion';

// Área mostrada em volta do ponto do registro (aproximação de rua)
const DETAIL_DELTA = 0.005;

// Mapa com o ponto de um registro: pequeno e estático no card (modo leve,
// que no Android vira uma imagem do mapa) ou interativo em tela cheia
export function LocationMap({
  latitude,
  longitude,
  interactive = false,
  style,
}) {
  const hasCoords = Number.isFinite(latitude) && Number.isFinite(longitude);

  if (!hasCoords) {
    return (
      <View style={[styles.placeholder, style]}>
        <Ionicons name="map-outline" size={24} color={palette.textMuted} />
        <Text style={styles.placeholderText}>Localização não disponível</Text>
      </View>
    );
  }

  const coordinate = { latitude, longitude };
  return (
    <View style={[styles.container, style, !interactive && styles.static]}>
      <MapView
        testID="location-map"
        style={styles.map}
        initialRegion={regionAround(coordinate, DETAIL_DELTA)}
        liteMode={!interactive}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
      >
        <Marker coordinate={coordinate} pinColor={palette.error} />
      </MapView>
    </View>
  );
}

LocationMap.propTypes = {
  latitude: PropTypes.number,
  longitude: PropTypes.number,
  interactive: PropTypes.bool,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: palette.neutral,
  },
  // Prévia estática: toques passam para o card (que abre o mapa em tela cheia)
  static: { pointerEvents: 'none' },
  map: { flex: 1 },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: palette.background,
  },
  placeholderText: { color: palette.textMuted, fontSize: 13 },
});
