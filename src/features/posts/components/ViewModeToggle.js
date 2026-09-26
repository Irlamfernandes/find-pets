import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SafeTouchable } from '../../../shared/components/SafeTouchable';
import { palette } from '../../../shared/theme/colors';

export const VIEW_MODES = [
  { mode: 'list', label: 'Lista', icon: 'list-outline' },
  { mode: 'map', label: 'Mapa', icon: 'map-outline' },
];

// Alterna entre a lista de cards e o mapa com todos os pets perdidos
export function ViewModeToggle({ value, onChange }) {
  return (
    <View style={styles.container}>
      {VIEW_MODES.map((option) => {
        const active = value === option.mode;
        return (
          <SafeTouchable
            key={option.mode}
            accessibilityState={{ selected: active }}
            style={[styles.button, active && styles.buttonActive]}
            onPress={() => onChange(option.mode)}
          >
            <Ionicons
              name={option.icon}
              size={18}
              color={active ? palette.white : palette.primary}
            />
            <Text style={[styles.text, active && styles.textActive]}>
              {option.label}
            </Text>
          </SafeTouchable>
        );
      })}
    </View>
  );
}

ViewModeToggle.propTypes = {
  value: PropTypes.oneOf(VIEW_MODES.map((option) => option.mode)).isRequired,
  onChange: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.cardBorder,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.primary,
  },
  buttonActive: { backgroundColor: palette.primary },
  text: { fontSize: 14, fontWeight: 'bold', color: palette.primary },
  textActive: { color: palette.white },
});
