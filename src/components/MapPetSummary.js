import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SafeTouchable } from './SafeTouchable';
import { PetInfoGrid } from './PetInfoGrid';
import { getPetFields, getPetTitle } from '../utils/petDescription';
import { getPostImages } from '../utils/postImages';
import { formatDateTime } from '../utils/timeZone';
import { palette } from '../theme/colors';

// Resumo do pet mostrado sobre o mapa ao tocar no ponto dele
export function MapPetSummary({
  post,
  onClose,
  onOpenPhoto,
  onOpenWhatsApp,
  onOpenRoute,
}) {
  const [photo] = getPostImages(post);
  const occurredAt = post.occurredAt
    ? formatDateTime(post.occurredAt, post.occurredZone)
    : post.date;

  return (
    <View testID="map-pet-summary" style={styles.card}>
      <View style={styles.header}>
        <SafeTouchable
          accessibilityLabel="Ver foto em tela cheia"
          onPress={onOpenPhoto}
        >
          <Image source={{ uri: photo }} style={styles.photo} />
        </SafeTouchable>

        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            {getPetTitle(post) || 'Pet perdido'}
          </Text>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={14} color={palette.textMuted} />
            <Text style={styles.infoText}>{occurredAt}</Text>
          </View>
          {post.location ? (
            <View style={styles.infoRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color={palette.textMuted}
              />
              <Text style={styles.infoText} numberOfLines={2}>
                {post.location}
              </Text>
            </View>
          ) : null}
        </View>

        <SafeTouchable
          accessibilityLabel="Fechar resumo"
          style={styles.closeButton}
          onPress={onClose}
        >
          <Ionicons name="close" size={22} color={palette.textMuted} />
        </SafeTouchable>
      </View>

      {/* O nome já está no título */}
      <PetInfoGrid fields={getPetFields(post, { includeName: false })} />

      <View style={styles.actions}>
        <SafeTouchable
          style={[styles.actionButton, styles.whatsappButton]}
          onPress={() => onOpenWhatsApp(post.contactPhone)}
        >
          <Ionicons name="logo-whatsapp" size={18} color={palette.white} />
          <Text style={styles.actionText}>WhatsApp</Text>
        </SafeTouchable>
        <SafeTouchable
          style={[styles.actionButton, styles.routeButton]}
          onPress={onOpenRoute}
        >
          <Ionicons name="navigate-outline" size={18} color={palette.white} />
          <Text style={styles.actionText}>Como chegar</Text>
        </SafeTouchable>
      </View>
    </View>
  );
}

MapPetSummary.propTypes = {
  post: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onOpenPhoto: PropTypes.func.isRequired,
  onOpenWhatsApp: PropTypes.func.isRequired,
  onOpenRoute: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  header: { flexDirection: 'row', gap: 10 },
  photo: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: palette.neutral,
  },
  headerText: { flex: 1 },
  title: { fontSize: 18, fontWeight: 'bold', color: palette.text },
  infoRow: { flexDirection: 'row', gap: 4, marginTop: 3 },
  infoText: { flex: 1, fontSize: 12, color: palette.textMuted },
  closeButton: { padding: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  actionButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  whatsappButton: { backgroundColor: palette.success },
  routeButton: { backgroundColor: palette.primary },
  actionText: { color: palette.white, fontWeight: 'bold', fontSize: 13 },
});
