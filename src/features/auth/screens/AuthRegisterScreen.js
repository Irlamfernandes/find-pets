import React, { useRef } from 'react';
import { Text, StyleSheet, Image } from 'react-native';
import PropTypes from 'prop-types';
import { SafeTouchable } from '../../../shared/components/SafeTouchable';
import { useBackHandler } from '../../../shared/hooks/useBackHandler';
import {
  FormScrollView,
  FormTextInput,
} from '../../../shared/components/FormScrollView';
import { dismissKeyboardAnd } from '../../../shared/utils/keyboard';
import { useSingleFlight } from '../../../shared/hooks/useSingleFlight';
import { palette } from '../../../shared/theme/colors';

export function AuthRegisterScreen({
  usuario,
  setUsuario,
  senha,
  setSenha,
  errorMessage,
  handleRegister,
  onBack,
}) {
  const passwordRef = useRef(null);
  useBackHandler(dismissKeyboardAnd(onBack));
  // Botão e tecla "concluir" compartilham a mesma trava
  const register = useSingleFlight(dismissKeyboardAnd(handleRegister));

  return (
    <FormScrollView
      style={styles.keyboardContainer}
      contentContainerStyle={styles.container}
    >
      <Image
        source={require('../../../../assets/adaptive-icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Cadastro</Text>
      <Text style={styles.subtitle}>Crie seus dados de acesso</Text>

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      <FormTextInput
        style={[styles.input, !!errorMessage && styles.inputError]}
        placeholder="E-mail"
        placeholderTextColor="#888"
        value={usuario}
        onChangeText={setUsuario}
        autoCapitalize="none"
        keyboardType="email-address"
        selectionColor={palette.primary}
        caretHidden={false}
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />

      <FormTextInput
        ref={passwordRef}
        style={[styles.input, !!errorMessage && styles.inputError]}
        placeholder="Senha"
        placeholderTextColor="#888"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        selectionColor={palette.primary}
        returnKeyType="done"
        onSubmitEditing={register}
      />

      <SafeTouchable style={styles.button} onPress={register}>
        <Text style={styles.buttonText}>Criar conta</Text>
      </SafeTouchable>

      <SafeTouchable
        style={styles.backButton}
        onPress={dismissKeyboardAnd(onBack)}
      >
        <Text style={styles.backButtonText}>Voltar</Text>
      </SafeTouchable>
    </FormScrollView>
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
  logo: {
    width: 72,
    height: 72,
    alignSelf: 'center',
    marginBottom: 12,
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
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backButtonText: {
    color: palette.textMuted,
    fontSize: 14,
  },
});
