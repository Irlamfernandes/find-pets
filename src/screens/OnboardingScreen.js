import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';
import { useOnboarding } from '../hooks/useOnboarding';

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
    <View style={styles.container}>
      <Text style={styles.title}>Complete seu Perfil</Text>
      <Text style={styles.subtitle}>
        Precisamos de algumas informações para facilitar o contato nos resgates.
      </Text>

      {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

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
    </View>
  );
}

OnboardingScreen.propTypes = {
  onComplete: PropTypes.func,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#FAFAFA',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A90E2',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
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
});
