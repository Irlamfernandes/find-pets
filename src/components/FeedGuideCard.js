import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SafeTouchable } from './SafeTouchable';
import { palette } from '../theme/colors';

export const FEED_GUIDE_STEPS = [
  {
    icon: 'megaphone-outline',
    title: 'Perdeu seu pet?',
    text: 'Toque em "Registrar desaparecimento" e envie fotos, uma descrição e o endereço de onde ele sumiu.',
  },
  {
    icon: 'paw-outline',
    title: 'Viu algum pet da lista?',
    text: 'Use "WhatsApp" para falar com o dono ou "Como chegar" para ver a rota até o local.',
  },
  {
    icon: 'expand-outline',
    title: 'Veja os detalhes',
    text: 'Toque nas fotos ou no mapa de cada registro para abrir em tela cheia.',
  },
  {
    icon: 'heart-outline',
    title: 'Pet encontrado',
    text: 'Quem registrou marca como "Encontrado" e conta como foi o reencontro.',
  },
];

export function FeedGuideCard({ onDismiss }) {
  return (
    <View testID="feed-guide" style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="information-circle" size={24} color={palette.primary} />
        <Text style={styles.title}>Como funciona o FindPets</Text>
      </View>

      {FEED_GUIDE_STEPS.map((step) => (
        <View key={step.title} style={styles.step}>
          <View style={styles.stepIcon}>
            <Ionicons name={step.icon} size={18} color={palette.primary} />
          </View>
          <View style={styles.stepBody}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepText}>{step.text}</Text>
          </View>
        </View>
      ))}

      <SafeTouchable
        testID="button-dismiss-guide"
        style={styles.button}
        onPress={onDismiss}
      >
        <Text style={styles.buttonText}>Entendi</Text>
      </SafeTouchable>
    </View>
  );
}

FeedGuideCard.propTypes = {
  onDismiss: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.primarySoft,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: { fontSize: 17, fontWeight: 'bold', color: palette.text },
  step: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: 'bold', color: palette.text },
  stepText: {
    fontSize: 13,
    color: palette.textMuted,
    lineHeight: 18,
    marginTop: 2,
  },
  button: {
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: { color: palette.white, fontWeight: 'bold', fontSize: 15 },
});
