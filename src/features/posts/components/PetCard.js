import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SafeTouchable } from '../../../shared/components/SafeTouchable';
import { ActionButton } from '../../../shared/components/ActionButton';
import { InfoRow } from '../../../shared/components/InfoRow';
import { palette } from '../../../shared/theme/colors';
import { LocationMap } from '../../map/components/LocationMap';
import { getPetFields } from '../utils/petDescription';
import { getPostImages } from '../utils/postImages';
import { getPostStatus, isFound, getOccurredAtLabel } from '../domain/post';
import { PetInfoGrid } from './PetInfoGrid';
import { PhotoCarousel } from './PhotoCarousel';
import { FoundInfoBox } from './FoundInfoBox';
import { ContactButtons } from './ContactButtons';

export { getPostImages } from '../utils/postImages';

// Ações exclusivas de quem registrou; cada uma aparece se a prop existir
const OWNER_ACTIONS = [
  {
    prop: 'onMarkFound',
    label: 'Encontrado',
    icon: 'checkmark-circle-outline',
    variant: 'success',
    accessibilityLabel: 'Marcar como encontrado',
  },
  {
    prop: 'onEdit',
    label: 'Editar',
    icon: 'create-outline',
    variant: 'dark',
    accessibilityLabel: 'Editar registro',
  },
  {
    prop: 'onDelete',
    label: 'Excluir',
    icon: 'trash-outline',
    variant: 'danger',
  },
];

function OwnerActions({ handlers }) {
  const actions = OWNER_ACTIONS.filter((action) => handlers[action.prop]);
  if (actions.length === 0) return null;

  return (
    <View style={styles.ownerActions}>
      {actions.map(({ prop, ...action }) => (
        <ActionButton key={prop} {...action} onPress={handlers[prop]} />
      ))}
    </View>
  );
}

OwnerActions.propTypes = {
  handlers: PropTypes.objectOf(PropTypes.func).isRequired,
};

export function PetCard({
  item,
  onOpenPhoto,
  onOpenMap,
  onOpenWhatsApp,
  onOpenRoute,
  onShare,
  ...ownerHandlers
}) {
  return (
    <View style={styles.card}>
      <PhotoCarousel images={getPostImages(item)} onOpenPhoto={onOpenPhoto} />

      <View style={styles.info}>
        <Text style={[styles.badge, isFound(item) && styles.foundBadge]}>
          {getPostStatus(item)}
        </Text>

        <PetInfoGrid fields={getPetFields(item)} />

        {item.foundInfo ? <FoundInfoBox foundInfo={item.foundInfo} /> : null}

        {item.description ? (
          <Text style={styles.description}>{item.description}</Text>
        ) : null}

        <InfoRow
          icon="time-outline"
          text={`Desapareceu em: ${getOccurredAtLabel(item)}`}
        />
        {item.location ? (
          <InfoRow icon="location-outline" text={item.location} />
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

        <ContactButtons
          post={item}
          onOpenWhatsApp={onOpenWhatsApp}
          onOpenRoute={onOpenRoute}
        />

        <ActionButton
          icon="share-social-outline"
          label="Compartilhar"
          variant="outline"
          accessibilityLabel="Compartilhar este registro"
          style={styles.shareButton}
          onPress={onShare}
        />

        <OwnerActions handlers={ownerHandlers} />
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
  info: { padding: 12 },
  badge: {
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
  foundBadge: { backgroundColor: palette.success, color: palette.white },
  description: {
    fontSize: 15,
    color: palette.text,
    lineHeight: 21,
    marginBottom: 10,
  },
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
  shareButton: { flex: 0, marginTop: 8 },
  ownerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
});
