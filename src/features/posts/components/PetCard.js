import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SafeTouchable } from '../../../shared/components/SafeTouchable';
import { palette } from '../../../shared/theme/colors';
import { LocationMap } from '../../map/components/LocationMap';
import { formatDateTime } from '../../../shared/utils/timeZone';
import { getPetFields } from '../utils/petDescription';
import { PetInfoGrid } from './PetInfoGrid';

import { getPostImages } from '../utils/postImages';

export { getPostImages };

export function PetCard({
  item,
  onOpenPhoto,
  onOpenMap,
  onOpenWhatsApp,
  onOpenRoute,
  onShare,
  onEdit,
  onDelete,
  onMarkFound,
}) {
  const [carouselWidth, setCarouselWidth] = useState(0);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const images = getPostImages(item);
  const status = item.status || item.type;
  const hasCoords =
    Number.isFinite(item.latitude) && Number.isFinite(item.longitude);
  const petFields = getPetFields(item);
  const occurredAt = item.occurredAt
    ? formatDateTime(item.occurredAt, item.occurredZone)
    : item.date;

  const handleScrollEnd = (event) => {
    if (!carouselWidth) return;
    setCurrentPhoto(
      Math.round(event.nativeEvent.contentOffset.x / carouselWidth)
    );
  };

  return (
    <View style={styles.card}>
      <View
        testID="pet-carousel"
        style={styles.carousel}
        onLayout={(event) => setCarouselWidth(event.nativeEvent.layout.width)}
      >
        <FlatList
          data={images}
          keyExtractor={(uri, index) => `${uri}-${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
          renderItem={({ item: uri, index }) => (
            <SafeTouchable
              activeOpacity={0.9}
              accessibilityLabel={`Ver foto ${index + 1} em tela cheia`}
              onPress={() => onOpenPhoto(index)}
            >
              <Image
                testID="pet-image"
                source={{ uri }}
                style={[styles.cardImage, { width: carouselWidth }]}
              />
            </SafeTouchable>
          )}
        />
        {images.length > 1 ? (
          <View style={styles.photoCounter}>
            <Ionicons name="images-outline" size={14} color={palette.white} />
            <Text style={styles.photoCounterText}>
              {currentPhoto + 1}/{images.length}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardInfo}>
        <View style={styles.badgesRow}>
          <Text
            style={[
              styles.cardBadge,
              status === 'Encontrado' && styles.foundBadge,
            ]}
          >
            {status}
          </Text>
        </View>

        <PetInfoGrid fields={petFields} />

        {item.foundInfo ? (
          <View testID="found-info" style={styles.foundInfo}>
            <View style={styles.foundInfoHeader}>
              <Ionicons name="heart" size={16} color={palette.success} />
              <Text style={styles.foundInfoTitle}>Reencontro registrado</Text>
            </View>
            <Text style={styles.foundInfoText}>
              {`Com: ${item.foundInfo.receiverName} (${item.foundInfo.receiverRelation})`}
            </Text>
            <Text style={styles.foundInfoText}>
              Em:{' '}
              {formatDateTime(item.foundInfo.foundAt, item.foundInfo.foundZone)}
            </Text>
            {item.foundInfo.foundLocation ? (
              <Text style={styles.foundInfoText}>
                Onde: {item.foundInfo.foundLocation}
              </Text>
            ) : null}
            {item.foundInfo.notes ? (
              <Text style={styles.foundInfoText}>{item.foundInfo.notes}</Text>
            ) : null}
          </View>
        ) : null}

        {item.description ? (
          <Text style={styles.description}>{item.description}</Text>
        ) : null}

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color={palette.textMuted} />
          <Text style={styles.infoText}>Desapareceu em: {occurredAt}</Text>
        </View>

        {item.location ? (
          <View style={styles.infoRow}>
            <Ionicons
              name="location-outline"
              size={16}
              color={palette.textMuted}
            />
            <Text style={styles.infoText}>{item.location}</Text>
          </View>
        ) : null}

        <SafeTouchable
          testID="button-open-map"
          accessibilityLabel="Abrir mapa em tela cheia"
          activeOpacity={0.85}
          style={styles.mapContainer}
          onPress={onOpenMap}
        >
          <LocationMap
            latitude={item.latitude}
            longitude={item.longitude}
            style={styles.map}
          />
          <View style={styles.mapHint}>
            <Ionicons name="expand-outline" size={14} color={palette.white} />
            <Text style={styles.mapHintText}>Ampliar mapa</Text>
          </View>
        </SafeTouchable>

        <View style={styles.contactButtonsContainer}>
          <SafeTouchable
            style={[styles.actionButton, styles.whatsappButton]}
            onPress={() => onOpenWhatsApp(item.contactPhone)}
          >
            <View style={styles.actionButtonContent}>
              <Ionicons name="logo-whatsapp" size={18} color={palette.white} />
              <Text style={styles.actionButtonText}>WhatsApp</Text>
            </View>
          </SafeTouchable>

          {hasCoords ? (
            <SafeTouchable
              accessibilityLabel="Traçar rota até o local no app de mapas"
              style={[styles.actionButton, styles.routeButton]}
              onPress={onOpenRoute}
            >
              <View style={styles.actionButtonContent}>
                <Ionicons
                  name="navigate-outline"
                  size={18}
                  color={palette.white}
                />
                <Text style={styles.actionButtonText}>Como chegar</Text>
              </View>
            </SafeTouchable>
          ) : null}
        </View>

        <SafeTouchable
          accessibilityLabel="Compartilhar este registro"
          style={[styles.actionButton, styles.shareButton]}
          onPress={onShare}
        >
          <View style={styles.actionButtonContent}>
            <Ionicons
              name="share-social-outline"
              size={18}
              color={palette.primary}
            />
            <Text style={[styles.actionButtonText, styles.shareButtonText]}>
              Compartilhar
            </Text>
          </View>
        </SafeTouchable>

        {onDelete || onMarkFound || onEdit ? (
          <View style={styles.actionButtonsContainer}>
            {onMarkFound ? (
              <SafeTouchable
                accessibilityLabel="Marcar como encontrado"
                style={[styles.actionButton, styles.foundButton]}
                onPress={onMarkFound}
              >
                <View style={styles.actionButtonContent}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color={palette.white}
                  />
                  <Text style={styles.actionButtonText}>Encontrado</Text>
                </View>
              </SafeTouchable>
            ) : null}

            {onEdit ? (
              <SafeTouchable
                accessibilityLabel="Editar registro"
                style={[styles.actionButton, styles.editButton]}
                onPress={onEdit}
              >
                <View style={styles.actionButtonContent}>
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color={palette.white}
                  />
                  <Text style={styles.actionButtonText}>Editar</Text>
                </View>
              </SafeTouchable>
            ) : null}

            {onDelete ? (
              <SafeTouchable
                style={[styles.actionButton, styles.deleteButton]}
                onPress={onDelete}
              >
                <View style={styles.actionButtonContent}>
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={palette.white}
                  />
                  <Text style={styles.actionButtonText}>Excluir</Text>
                </View>
              </SafeTouchable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

PetCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    imageUri: PropTypes.string,
    images: PropTypes.arrayOf(PropTypes.string),
    description: PropTypes.string,
    type: PropTypes.string.isRequired,
    status: PropTypes.string,
    date: PropTypes.string.isRequired,
    occurredAt: PropTypes.string,
    occurredZone: PropTypes.shape({
      offsetMinutes: PropTypes.number,
      abbreviation: PropTypes.string,
    }),
    latitude: PropTypes.number,
    longitude: PropTypes.number,
    location: PropTypes.string,
    contactPhone: PropTypes.string,
    petName: PropTypes.string,
    species: PropTypes.string,
    size: PropTypes.string,
    sex: PropTypes.string,
    color: PropTypes.string,
    breed: PropTypes.string,
    foundInfo: PropTypes.shape({
      receiverName: PropTypes.string,
      receiverRelation: PropTypes.string,
      foundAt: PropTypes.string,
      foundZone: PropTypes.shape({
        offsetMinutes: PropTypes.number,
        abbreviation: PropTypes.string,
      }),
      foundLocation: PropTypes.string,
      notes: PropTypes.string,
    }),
  }).isRequired,
  onOpenPhoto: PropTypes.func.isRequired,
  onOpenMap: PropTypes.func.isRequired,
  onOpenWhatsApp: PropTypes.func.isRequired,
  onOpenRoute: PropTypes.func.isRequired,
  onShare: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onMarkFound: PropTypes.func,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  carousel: { height: 250, backgroundColor: palette.neutral },
  cardImage: { height: 250 },
  photoCounter: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  photoCounterText: { color: palette.white, fontSize: 12, fontWeight: 'bold' },
  foundInfo: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    gap: 2,
  },
  foundInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  foundInfoTitle: { fontWeight: 'bold', color: palette.text },
  foundInfoText: { fontSize: 13, color: palette.text },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  shareButton: {
    marginTop: 8,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.primary,
  },
  shareButtonText: { color: palette.primary },
  editButton: { backgroundColor: palette.primaryDark },
  description: {
    fontSize: 15,
    color: palette.text,
    lineHeight: 21,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 6,
  },
  infoText: { flex: 1, fontSize: 13, color: palette.textMuted },
  mapContainer: {
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  map: { flex: 1 },
  mapHint: {
    position: 'absolute',
    right: 8,
    top: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  mapHintText: { color: palette.white, fontSize: 12, fontWeight: 'bold' },
  cardInfo: { padding: 12 },
  cardBadge: {
    alignSelf: 'flex-start',
    backgroundColor: palette.accentSoft,
    color: palette.text,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 6,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  whatsappButton: {
    backgroundColor: palette.success,
  },
  routeButton: {
    backgroundColor: palette.primary,
  },
  deleteButton: {
    backgroundColor: palette.error,
  },
  foundButton: {
    backgroundColor: palette.success,
  },
  foundBadge: {
    backgroundColor: palette.success,
    color: palette.white,
  },
  actionButtonText: {
    color: palette.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
