import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useLogin } from '../hooks/useLogin';

export default function LoginScreen({ onLoginSuccess }) {
  const {
    email,
    setEmail,
    password,
    setPassword,
    hasBiometrics,
    errorMessage,
    handleManualLogin,
    triggerBiometricAuth,
  } = useLogin(onLoginSuccess);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FindPets</Text>
      <Text style={styles.subtitle}>Entre na sua conta</Text>

      {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      <TextInput
        testID="input-email"
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        testID="input-password"
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        testID="button-login"
        style={styles.button}
        onPress={handleManualLogin}
      >
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>

      {hasBiometrics && (
        <TouchableOpacity
          testID="button-biometrics"
          style={styles.biometricButton}
          onPress={triggerBiometricAuth}
        >
          <Text style={styles.biometricButtonText}>Usar Biometria</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

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
  errorText: { color: '#D0021B', textAlign: 'center', marginBottom: 12 },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFF',
  },
  button: {
    height: 50,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  biometricButton: {
    height: 50,
    borderWidth: 1,
    borderColor: '#4A90E2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  biometricButtonText: { color: '#4A90E2', fontSize: 16, fontWeight: 'bold' },
});
