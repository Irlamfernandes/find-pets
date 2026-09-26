import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { palette } from '../../../shared/theme/colors';

// Dados do pet em grade de duas colunas, cada um com seu rótulo
export function PetInfoGrid({ fields }) {
  if (fields.length === 0) return null;

  return (
    <View testID="pet-info-grid" style={styles.grid}>
      {fields.map((field) => (
        <View key={field.label} style={styles.cell}>
          <Text style={styles.label}>{field.label}</Text>
          <Text style={styles.value}>{field.value}</Text>
        </View>
      ))}
    </View>
  );
}

PetInfoGrid.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    })
  ).isRequired,
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
    marginVertical: 8,
  },
  cell: {
    // Duas colunas com um espaço entre elas
    width: '48.5%',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.text,
    marginTop: 2,
  },
});
