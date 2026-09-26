import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { palette } from '../theme/colors';

// Mapa (Leaflet + OpenStreetMap) com um ponto por pet perdido. Tocar num
// ponto avisa o app ({ type: 'select', id }); tocar fora avisa 'clear'.
export function buildLostPetsMapHtml(posts) {
  const points = posts.map(({ id, latitude, longitude }) => ({
    id,
    latitude,
    longitude,
  }));
  // Evita que algum valor feche a tag <script> antes da hora
  const pointsJson = JSON.stringify(points).replace(/</g, '\\u003c');

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
  var points = ${pointsJson};
  var NORMAL = { radius: 10, fillColor: '${palette.error}' };
  var SELECTED = { radius: 15, fillColor: '#991B1B' };
  var map = L.map('map');
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  function send(message) {
    window.ReactNativeWebView.postMessage(JSON.stringify(message));
  }

  var selected = null;
  function select(marker) {
    if (selected) {
      selected.setRadius(NORMAL.radius);
      selected.setStyle({ fillColor: NORMAL.fillColor });
    }
    selected = marker;
    if (marker) {
      marker.setRadius(SELECTED.radius);
      marker.setStyle({ fillColor: SELECTED.fillColor });
      marker.bringToFront();
    }
  }
  window.clearSelection = function () { select(null); };

  points.forEach(function (point) {
    var marker = L.circleMarker([point.latitude, point.longitude], {
      radius: NORMAL.radius,
      color: '#FFFFFF',
      weight: 3,
      fillColor: NORMAL.fillColor,
      fillOpacity: 1
    }).addTo(map);
    marker.on('click', function (event) {
      L.DomEvent.stopPropagation(event);
      select(marker);
      send({ type: 'select', id: point.id });
    });
  });

  map.on('click', function () {
    select(null);
    send({ type: 'clear' });
  });

  if (points.length === 1) {
    map.setView([points[0].latitude, points[0].longitude], 15);
  } else {
    map.fitBounds(
      points.map(function (point) { return [point.latitude, point.longitude]; }),
      { padding: [40, 40], maxZoom: 16 }
    );
  }
</script>
</body>
</html>`;
}

export function LostPetsMap({ posts, selectedId, onSelect, onClear }) {
  const webViewRef = useRef(null);
  // Só remonta o mapa quando os pontos mudam (e não a cada seleção)
  const html = useMemo(() => buildLostPetsMapHtml(posts), [posts]);

  // Ao fechar o resumo pelo app, tira o destaque do ponto no mapa
  useEffect(() => {
    if (selectedId === null) {
      webViewRef.current?.injectJavaScript(
        'window.clearSelection && window.clearSelection(); true;'
      );
    }
  }, [selectedId]);

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

  const handleMessage = (event) => {
    const message = JSON.parse(event.nativeEvent.data);
    if (message.type === 'select') onSelect(message.id);
    else onClear();
  };

  return (
    <WebView
      ref={webViewRef}
      testID="lost-pets-map"
      originWhitelist={['*']}
      source={{
        html,
        baseUrl: 'https://findpets.app/',
      }}
      applicationNameForUserAgent="FindPets/1.0"
      onMessage={handleMessage}
      style={styles.map}
    />
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
