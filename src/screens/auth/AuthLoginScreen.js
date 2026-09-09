// src/screens/AuthLoginScreen.js
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';

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
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <Text style={styles.subtitle}>Entre com sua conta</Text>

      {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      <TextInput
        style={[styles.input, !!errorMessage && styles.inputError]}
        placeholder="Usuário"
        placeholderTextColor="#888"
        value={usuario}
        onChangeText={setUsuario}
        autoCapitalize="none"
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
    </View>
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
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#FAFAFA',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A90E2',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorText: {
    color: '#D0021B',
    textAlign: 'center',
    marginBottom: 12,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFF',
    color: '#333',
  },
  inputError: {
    borderColor: '#D0021B',
  },
  button: {
    height: 50,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  biometricButton: {
    height: 50,
    borderWidth: 1,
    borderColor: '#4A90E2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#F0F4F8',
  },
  biometricButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
  },
});
