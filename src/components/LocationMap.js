import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { palette } from '../theme/colors';

// Mapa gratuito (Leaflet + OpenStreetMap) renderizado dentro do app,
// sem chave de API. O OSM exige atribuição visível e identificação do app.
export function buildMapHtml(latitude, longitude, interactive) {
  const flag = interactive ? 'true' : 'false';
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html, body, #map { margin: 0; padding: 0; height: 100%; }</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', {
    zoomControl: ${flag},
    dragging: ${flag},
    touchZoom: ${flag},
    doubleClickZoom: ${flag},
    scrollWheelZoom: false,
    boxZoom: false,
    keyboard: false
  }).setView([${latitude}, ${longitude}], 16);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);
  L.marker([${latitude}, ${longitude}]).addTo(map);
</script>
</body>
</html>`;
}

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

  return (
    <View style={[styles.container, style, !interactive && styles.static]}>
      <WebView
        testID="location-map"
        originWhitelist={['*']}
        source={{
          html: buildMapHtml(latitude, longitude, interactive),
          baseUrl: 'https://findpets.app/',
        }}
        applicationNameForUserAgent="FindPets/1.0"
        scrollEnabled={false}
        style={styles.webview}
      />
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
  webview: { flex: 1, backgroundColor: 'transparent' },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: palette.background,
  },
  placeholderText: { color: palette.textMuted, fontSize: 13 },
});
