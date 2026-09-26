import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SafeTouchable } from '../../../shared/components/SafeTouchable';
import { LocationMap } from './LocationMap';
import { palette } from '../../../shared/theme/colors';

export function MapViewerModal({ post, onClose }) {
  return (
    <Modal visible={!!post} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Local do desaparecimento</Text>
            {post?.location ? (
              <Text style={styles.address} numberOfLines={2}>
                {post.location}
              </Text>
            ) : null}
          </View>
          <SafeTouchable
            testID="button-close-map-viewer"
            accessibilityLabel="Fechar mapa"
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={26} color={palette.text} />
          </SafeTouchable>
        </View>

        {post ? (
          <LocationMap
            latitude={post.latitude}
            longitude={post.longitude}
            interactive
            style={styles.map}
          />
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

MapViewerModal.propTypes = {
  post: PropTypes.shape({
    latitude: PropTypes.number,
    longitude: PropTypes.number,
    location: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: palette.cardBorder,
  },
  headerText: { flex: 1, marginRight: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: palette.text },
  address: { fontSize: 13, color: palette.textMuted, marginTop: 2 },
  closeButton: { padding: 4 },
  map: { flex: 1 },
});
