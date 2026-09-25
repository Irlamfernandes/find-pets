import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { palette } from '../../theme/colors';

export function PetCard({
  item,
  onOpenMap,
  onOpenWhatsApp,
  onDelete,
  onMarkFound,
}) {
  return (
    <View style={styles.card}>
      <Image
        testID="pet-image"
        source={{ uri: item.imageUri }}
        style={styles.cardImage}
      />
      <View style={styles.cardInfo}>
        <Text
          style={[
            styles.cardBadge,
            (item.status || item.type) === 'Encontrado' && styles.foundBadge,
          ]}
        >
          {item.status || item.type}
        </Text>
        <Text style={styles.cardDate}>Registrado em: {item.date}</Text>

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.mapButton]}
            onPress={() =>
              onOpenMap(item.latitude, item.longitude, item.location)
            }
          >
            <View style={styles.actionButtonContent}>
              <Ionicons
                name="location-outline"
                size={18}
                color={palette.white}
              />
              <Text style={styles.actionButtonText}>Ver no mapa</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.whatsappButton]}
            onPress={() => onOpenWhatsApp(item.contactPhone)}
          >
            <View style={styles.actionButtonContent}>
              <Ionicons name="logo-whatsapp" size={18} color={palette.white} />
              <Text style={styles.actionButtonText}>WhatsApp</Text>
            </View>
          </TouchableOpacity>
        </View>

        {onDelete ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={onDelete}
          >
            <View style={styles.actionButtonContent}>
              <Ionicons name="trash-outline" size={18} color={palette.white} />
              <Text style={styles.actionButtonText}>Excluir</Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {onMarkFound ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.foundButton]}
            onPress={onMarkFound}
          >
            <View style={styles.actionButtonContent}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={palette.white}
              />
              <Text style={styles.actionButtonText}>Finalizado</Text>
            </View>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

PetCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    imageUri: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    status: PropTypes.string,
    date: PropTypes.string.isRequired,
    latitude: PropTypes.number,
    longitude: PropTypes.number,
    location: PropTypes.string,
    contactPhone: PropTypes.string,
  }).isRequired,
  onOpenMap: PropTypes.func.isRequired,
  onOpenWhatsApp: PropTypes.func.isRequired,
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
  cardImage: { width: '100%', height: 250 },
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
  cardDate: { fontSize: 12, color: palette.textMuted, marginBottom: 12 },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapButton: {
    backgroundColor: palette.primary,
  },
  whatsappButton: {
    backgroundColor: palette.success,
  },
  deleteButton: {
    backgroundColor: palette.error,
    marginTop: 4,
  },
  foundButton: {
    backgroundColor: palette.success,
    marginTop: 4,
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
