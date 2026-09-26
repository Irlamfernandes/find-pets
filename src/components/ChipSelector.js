import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { SafeTouchable } from './SafeTouchable';
import { dismissKeyboardAnd } from '../utils/keyboard';
import { palette } from '../theme/colors';

// Grupo de opções em forma de "chip". Tocar na opção já escolhida a
// desmarca, exceto quando o campo é obrigatório.
export function ChipSelector({ options, value, onChange, required = false }) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const selected = value === option;
        return (
          <SafeTouchable
            key={option}
            accessibilityState={{ selected }}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={dismissKeyboardAnd(() =>
              onChange(selected && !required ? '' : option)
            )}
          >
            <Text style={[styles.text, selected && styles.textSelected]}>
              {option}
            </Text>
          </SafeTouchable>
        );
      })}
    </View>
  );
}

ChipSelector.propTypes = {
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: palette.surface,
  },
  chipSelected: {
    borderColor: palette.primary,
    backgroundColor: palette.primarySoft,
  },
  text: { fontSize: 14, color: palette.text },
  textSelected: { color: palette.primary, fontWeight: 'bold' },
});
