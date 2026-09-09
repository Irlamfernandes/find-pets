import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import PropTypes from 'prop-types';

export function PetCard({ item, onOpenMap, onOpenWhatsApp }) {
  return (
    <View style={styles.card}>
      <Image
        testID="pet-image"
        source={{ uri: item.imageUri }}
        style={styles.cardImage}
      />
      <View style={styles.cardInfo}>
        <Text style={styles.cardBadge}>{item.type}</Text>
        <Text style={styles.cardDate}>Registrado em: {item.date}</Text>

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.mapButton]}
            onPress={() =>
              onOpenMap(item.latitude, item.longitude, item.location)
            }
          >
            <Text style={styles.actionButtonText}>📍 Ver no Mapa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.whatsappButton]}
            onPress={() => onOpenWhatsApp(item.contactPhone)}
          >
            <Text style={styles.actionButtonText}>💬 WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

PetCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    imageUri: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    latitude: PropTypes.number,
    longitude: PropTypes.number,
    location: PropTypes.string,
    contactPhone: PropTypes.string,
  }).isRequired,
  onOpenMap: PropTypes.func.isRequired,
  onOpenWhatsApp: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cardImage: { width: '100%', height: 250 },
  cardInfo: { padding: 12 },
  cardBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ff9800',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 6,
  },
  cardDate: { fontSize: 12, color: '#777', marginBottom: 12 },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapButton: {
    backgroundColor: '#007AFF',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
