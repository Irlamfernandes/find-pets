import React, { useRef } from 'react';
import { Text, StyleSheet, Image } from 'react-native';
import PropTypes from 'prop-types';
import { SafeTouchable } from '../components/SafeTouchable';
import { dismissKeyboardAnd } from '../utils/keyboard';
import { useSingleFlight } from '../hooks/useSingleFlight';
import { FormScrollView, FormTextInput } from '../components/FormScrollView';
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
  const whatsappRef = useRef(null);
  // Botão e tecla "concluir" compartilham a mesma trava
  const saveProfile = useSingleFlight(dismissKeyboardAnd(handleSaveProfile));

  return (
    <FormScrollView
      style={styles.keyboardContainer}
      contentContainerStyle={styles.container}
    >
      <Image
        source={require('../../assets/adaptive-icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Complete seu Perfil</Text>
      <Text style={styles.subtitle}>
        Precisamos de algumas informações para facilitar o contato nos resgates.
      </Text>

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      <FormTextInput
        testID="input-name"
        style={styles.input}
        placeholder="Seu Nome"
        value={name}
        onChangeText={setName}
        selectionColor={palette.primary}
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => whatsappRef.current?.focus()}
      />

      <FormTextInput
        ref={whatsappRef}
        testID="input-whatsapp"
        style={styles.input}
        placeholder="WhatsApp: +55 (11) 99999-9999"
        value={whatsapp}
        onChangeText={setWhatsapp}
        keyboardType="phone-pad"
        maxLength={19}
        selectionColor={palette.primary}
        returnKeyType="done"
        onSubmitEditing={saveProfile}
      />

      <SafeTouchable
        testID="button-complete"
        style={styles.button}
        onPress={saveProfile}
      >
        <Text style={styles.buttonText}>Salvar e Continuar</Text>
      </SafeTouchable>
    </FormScrollView>
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
  logo: {
    width: 64,
    height: 64,
    alignSelf: 'center',
    marginBottom: 12,
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
