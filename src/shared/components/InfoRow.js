import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { palette } from '../theme/colors';

// Linha com ícone e texto (data, endereço...)
export function InfoRow({ icon, text, size = 'regular', numberOfLines }) {
  const compact = size === 'compact';
  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <Ionicons
        name={icon}
        size={compact ? 14 : 16}
        color={palette.textMuted}
      />
      <Text
        style={[styles.text, compact && styles.textCompact]}
        numberOfLines={numberOfLines}
      >
        {text}
      </Text>
    </View>
  );
}

InfoRow.propTypes = {
  icon: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['regular', 'compact']),
  numberOfLines: PropTypes.number,
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 6,
  },
  rowCompact: { gap: 4, marginBottom: 0, marginTop: 3 },
  text: { flex: 1, fontSize: 13, color: palette.textMuted },
  textCompact: { fontSize: 12 },
});
