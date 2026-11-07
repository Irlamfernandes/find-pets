import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SafeTouchable } from '../../../shared/components/SafeTouchable';
import { dismissKeyboardAnd } from '../../../shared/utils/keyboard';
import { maskEmail } from '../../../shared/utils/maskEmail';
import { palette } from '../../../shared/theme/colors';

export function BiometricLoginButton({ owner, onPress, testID, style }) {
  return (
    <SafeTouchable
      testID={testID}
      style={[styles.button, style]}
      onPress={dismissKeyboardAnd(onPress)}
    >
      <Ionicons name="finger-print" size={24} color={palette.primary} />
      <Text style={styles.text}>Entrar com Biometria</Text>
      <Text style={styles.owner}>{maskEmail(owner)}</Text>
    </SafeTouchable>
  );
}

BiometricLoginButton.propTypes = {
  owner: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  testID: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: palette.primarySoft,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: palette.primarySoft,
  },
  text: {
    color: palette.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  owner: {
    color: palette.primary,
    fontSize: 12,
    marginTop: 2,
  },
});
