import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';
import { useLogin } from '../hooks/useLogin';

export default function LoginScreen({ onLoginSuccess }) {
  const {
    usuario,
    setUsuario,
    senha,
    setSenha,
    hasHardwareBiometric,
    errorMessage,
    authMode,
    setAuthMode,
    handleRegister,
    handleManualLogin,
    triggerBiometricAuth,
  } = useLogin(onLoginSuccess);

  // TELA 1: HOME (Com os 2 botões pedidos)
  if (authMode === 'home') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>FindPets</Text>
        <Text style={styles.subtitle}>Escolha uma opção</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            setAuthMode('login');
          }}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => {
            setAuthMode('cadastro');
          }}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Cadastrar
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // TELA 2: CADASTRO (Usuário, Senha e Biometria)
  if (authMode === 'cadastro') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Cadastro</Text>
        <Text style={styles.subtitle}>Crie seus dados de acesso</Text>

        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        <TextInput
          style={styles.input}
          placeholder="Usuário"
          placeholderTextColor="#888"
          value={usuario}
          onChangeText={setUsuario}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#888"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Salvar e Cadastrar Biometria</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setAuthMode('home');
          }}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // TELA 3: LOGIN (Usuário, Senha OU Biometria)
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <Text style={styles.subtitle}>Entre com sua conta</Text>

      {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Usuário"
        placeholderTextColor="#888"
        value={usuario}
        onChangeText={setUsuario}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        placeholderTextColor="#888"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleManualLogin}>
        <Text style={styles.buttonText}>Entrar com Senha</Text>
      </TouchableOpacity>

      {hasHardwareBiometric ? (
        <TouchableOpacity
          style={styles.biometricButton}
          onPress={triggerBiometricAuth}
        >
          <Text style={styles.biometricButtonText}>Entrar com Biometria</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          setAuthMode('home');
        }}
      >
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}

LoginScreen.propTypes = {
  onLoginSuccess: PropTypes.func.isRequired,
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
  secondaryButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#4A90E2',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#4A90E2',
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
