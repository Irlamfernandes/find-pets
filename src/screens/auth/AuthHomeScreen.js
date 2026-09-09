import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

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
});
