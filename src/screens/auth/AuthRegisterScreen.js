import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';

export function AuthRegisterScreen({
  usuario,
  setUsuario,
  senha,
  setSenha,
  errorMessage,
  handleRegister,
  onBack,
}) {
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

      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}

AuthRegisterScreen.propTypes = {
  usuario: PropTypes.string.isRequired,
  setUsuario: PropTypes.func.isRequired,
  senha: PropTypes.string.isRequired,
  setSenha: PropTypes.func.isRequired,
  errorMessage: PropTypes.string,
  handleRegister: PropTypes.func.isRequired,
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
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
  },
});
