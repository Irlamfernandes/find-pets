import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { palette } from '../../theme/colors';

export function AuthHomeScreen({ onNavigate }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>FindPets</Text>
      <Text style={styles.subtitle}>Escolha uma opção</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => onNavigate('login')}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={() => onNavigate('cadastro')}
      >
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>
          Cadastrar
        </Text>
      </TouchableOpacity>
    </View>
  );
}

AuthHomeScreen.propTypes = {
  onNavigate: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: palette.background,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: palette.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: palette.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    height: 52,
    backgroundColor: palette.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.primarySoft,
    marginTop: 12,
  },
  secondaryButtonText: {
    color: palette.primary,
  },
});
