import React from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import PropTypes from 'prop-types';
import { useOnboarding } from '../hooks/useOnboarding';
import { palette } from '../theme/colors';

export default function OnboardingScreen({ onComplete }) {
  const {
    name,
    setName,
    whatsapp,
    setWhatsapp,
    errorMessage,
    handleSaveProfile,
  } = useOnboarding(onComplete);

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Complete seu Perfil</Text>
        <Text style={styles.subtitle}>
          Precisamos de algumas informações para facilitar o contato nos
          resgates.
        </Text>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        <TextInput
          testID="input-name"
          style={styles.input}
          placeholder="Seu Nome"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          testID="input-whatsapp"
          style={styles.input}
          placeholder="WhatsApp (com DDD)"
          value={whatsapp}
          onChangeText={setWhatsapp}
          keyboardType="phone-pad"
        />

        <TouchableOpacity
          testID="button-complete"
          style={styles.button}
          onPress={handleSaveProfile}
        >
          <Text style={styles.buttonText}>Salvar e Continuar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

OnboardingScreen.propTypes = {
  onComplete: PropTypes.func,
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: palette.background,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: palette.background,
    paddingVertical: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: palette.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: palette.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorText: {
    color: palette.error,
    textAlign: 'center',
    marginBottom: 12,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: palette.neutral,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: palette.surface,
    color: palette.text,
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
});
