import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { getPosterContent } from '../utils/posterContent';
import { PetInfoGrid } from './PetInfoGrid';
import { palette } from '../../../shared/theme/colors';

// Cartaz do pet ("Procura-se"/"Encontrado") que vira a imagem compartilhada
export function SharePoster({ post, viewRef, onImageLoadEnd }) {
  const content = getPosterContent(post);

  const infoLines = [
    !content.isFound && content.occurredAt
      ? { icon: 'time-outline', text: `Desapareceu em ${content.occurredAt}` }
      : null,
    content.location
      ? { icon: 'location-outline', text: content.location }
      : null,
  ].filter(Boolean);

  return (
    <View
      ref={viewRef}
      testID="share-poster"
      collapsable={false}
      style={styles.poster}
    >
      <View style={[styles.headline, content.isFound && styles.foundHeadline]}>
        <Text style={styles.headlineText}>{content.headline}</Text>
      </View>

      <Image
        testID="share-poster-image"
        source={{ uri: content.image }}
        style={styles.image}
        onLoadEnd={onImageLoadEnd}
      />

      <View style={styles.body}>
        <Text style={styles.title}>{content.title}</Text>
        <PetInfoGrid fields={content.fields} />

        {infoLines.map((line) => (
          <View key={line.icon} style={styles.infoRow}>
            <Ionicons name={line.icon} size={16} color={palette.textMuted} />
            <Text style={styles.infoText}>{line.text}</Text>
          </View>
        ))}

        {content.description ? (
          <Text style={styles.description}>{content.description}</Text>
        ) : null}

        {content.phone ? (
          <View style={styles.contact}>
            <Ionicons name="logo-whatsapp" size={20} color={palette.white} />
            <Text style={styles.contactText}>{content.phone}</Text>
          </View>
        ) : null}

        <Text style={styles.footer}>Compartilhado pelo FindPets</Text>
      </View>
    </View>
  );
}

SharePoster.propTypes = {
  post: PropTypes.object.isRequired,
  viewRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  onImageLoadEnd: PropTypes.func,
};

const styles = StyleSheet.create({
  poster: {
    width: 320,
    alignSelf: 'center',
    backgroundColor: palette.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  headline: {
    backgroundColor: palette.error,
    paddingVertical: 10,
    alignItems: 'center',
  },
  foundHeadline: { backgroundColor: palette.success },
  headlineText: {
    color: palette.white,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  image: { width: 320, height: 320, backgroundColor: palette.neutral },
  body: { padding: 14 },
  title: { fontSize: 24, fontWeight: 'bold', color: palette.text },
  infoRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  infoText: { flex: 1, fontSize: 14, color: palette.text },
  description: {
    fontSize: 14,
    color: palette.text,
    marginTop: 8,
    lineHeight: 20,
  },
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: palette.success,
  },
  contactText: { color: palette.white, fontSize: 18, fontWeight: 'bold' },
  footer: {
    fontSize: 12,
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
});
