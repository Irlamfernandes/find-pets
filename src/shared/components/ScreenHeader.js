import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SafeTouchable } from './SafeTouchable';
import { dismissKeyboardAnd } from '../utils/keyboard';
import { palette } from '../theme/colors';

// Cabeçalho com seta de voltar e título
export function ScreenHeader({ title, onBack }) {
  return (
    <View style={styles.header}>
      <SafeTouchable
        testID="button-back"
        accessibilityLabel="Voltar"
        onPress={dismissKeyboardAnd(onBack)}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={22} color={palette.primary} />
      </SafeTouchable>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

ScreenHeader.propTypes = {
  title: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.cardBorder,
  },
  backButton: { padding: 4 },
  title: { fontSize: 18, fontWeight: 'bold', color: palette.text },
});
