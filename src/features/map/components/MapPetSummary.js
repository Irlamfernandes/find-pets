import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SafeTouchable } from '../../../shared/components/SafeTouchable';
import { PetInfoGrid } from '../../posts/components/PetInfoGrid';
import { getPetFields, getPetTitle } from '../../posts/utils/petDescription';
import { getPostImages } from '../../posts/utils/postImages';
import { getOccurredAtLabel } from '../../posts/domain/post';
import { ContactButtons } from '../../posts/components/ContactButtons';
import { InfoRow } from '../../../shared/components/InfoRow';
import { palette } from '../../../shared/theme/colors';

// Resumo do pet mostrado sobre o mapa ao tocar no ponto dele
export function MapPetSummary({
  post,
  onClose,
  onOpenPhoto,
  onOpenWhatsApp,
  onOpenRoute,
}) {
  const [photo] = getPostImages(post);

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
          <InfoRow
            icon="time-outline"
            text={getOccurredAtLabel(post)}
            size="compact"
          />
          {post.location ? (
            <InfoRow
              icon="location-outline"
              text={post.location}
              size="compact"
              numberOfLines={2}
            />
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

      <ContactButtons
        post={post}
        onOpenWhatsApp={onOpenWhatsApp}
        onOpenRoute={onOpenRoute}
      />
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
  header: { flexDirection: 'row', gap: 10, marginBottom: 2 },
  photo: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: palette.neutral,
  },
  headerText: { flex: 1 },
  title: { fontSize: 18, fontWeight: 'bold', color: palette.text },
  closeButton: { padding: 2 },
});
