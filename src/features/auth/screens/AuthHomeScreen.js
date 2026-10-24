import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import PropTypes from 'prop-types';
import { SafeTouchable } from '../../../shared/components/SafeTouchable';
import { palette } from '../../../shared/theme/colors';

// Tela inicial de quem não entrou: escolher entre entrar e criar conta
export function AuthHomeScreen({ onNavigate }) {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../../../assets/adaptive-icon.png')}
        style={styles.logo}
        contentFit="contain"
      />
      <Text style={styles.title}>FindPets</Text>
      <Text style={styles.subtitle}>Escolha uma opção</Text>

      <SafeTouchable
        testID="button-go-login"
        style={styles.button}
        onPress={() => onNavigate('login')}
      >
        <Text style={styles.buttonText}>Login</Text>
      </SafeTouchable>

      <SafeTouchable
        testID="button-go-register"
        style={[styles.button, styles.secondaryButton]}
        onPress={() => onNavigate('cadastro')}
      >
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>
          Cadastrar
        </Text>
      </SafeTouchable>
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
  logo: {
    width: 92,
    height: 92,
    alignSelf: 'center',
    marginBottom: 14,
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
