import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SafeTouchable } from './SafeTouchable';
import { palette } from '../theme/colors';

const VARIANTS = {
  primary: { background: palette.primary, content: palette.white },
  dark: { background: palette.primaryDark, content: palette.white },
  success: { background: palette.success, content: palette.white },
  danger: { background: palette.error, content: palette.white },
  outline: {
    background: palette.surface,
    content: palette.primary,
    border: palette.primary,
  },
};

// Botão com ícone e texto usado nas ações dos cards
export function ActionButton({
  icon,
  label,
  onPress,
  variant = 'primary',
  accessibilityLabel,
  style,
}) {
  const colors = VARIANTS[variant];

  return (
    <SafeTouchable
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.button,
        { backgroundColor: colors.background },
        colors.border && [styles.bordered, { borderColor: colors.border }],
        style,
      ]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={18} color={colors.content} />
      <Text style={[styles.label, { color: colors.content }]}>{label}</Text>
    </SafeTouchable>
  );
}

ActionButton.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(Object.keys(VARIANTS)),
  accessibilityLabel: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  bordered: { borderWidth: 1 },
  label: { fontWeight: 'bold', fontSize: 12 },
});
