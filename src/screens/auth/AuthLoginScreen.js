import React from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import PropTypes from 'prop-types';
import { palette } from '../../theme/colors';

export function AuthLoginScreen({
  usuario,
  setUsuario,
  senha,
  setSenha,
  hasHardwareBiometric,
  errorMessage,
  handleManualLogin,
  triggerBiometricAuth,
  onBack,
}) {
  return (
    <KeyboardAvoidingView style={styles.keyboardContainer} behavior="padding">
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Login</Text>
        <Text style={styles.subtitle}>Entre com sua conta</Text>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        <TextInput
          style={[styles.input, !!errorMessage && styles.inputError]}
          placeholder="E-mail"
          placeholderTextColor="#888"
          value={usuario}
          onChangeText={setUsuario}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={[styles.input, !!errorMessage && styles.inputError]}
          placeholder="Senha"
          placeholderTextColor="#888"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleManualLogin}>
          <Text style={styles.buttonText}>Entrar com Senha</Text>
        </TouchableOpacity>

        {hasHardwareBiometric && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={triggerBiometricAuth}
          >
            <Text style={styles.biometricButtonText}>Entrar com Biometria</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

AuthLoginScreen.propTypes = {
  usuario: PropTypes.string.isRequired,
  setUsuario: PropTypes.func.isRequired,
  senha: PropTypes.string.isRequired,
  setSenha: PropTypes.func.isRequired,
  hasHardwareBiometric: PropTypes.bool.isRequired,
  errorMessage: PropTypes.string,
  handleManualLogin: PropTypes.func.isRequired,
  triggerBiometricAuth: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
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
  inputError: {
    borderColor: palette.error,
  },
  button: {
    height: 52,
    backgroundColor: palette.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  biometricButton: {
    height: 52,
    borderWidth: 1,
    borderColor: palette.primarySoft,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: palette.primarySoft,
  },
  biometricButtonText: {
    color: palette.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backButtonText: {
    color: palette.textMuted,
    fontSize: 14,
  },
});
