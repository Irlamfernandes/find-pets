import React, { useRef } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import PropTypes from 'prop-types';
import { SafeTouchable } from '../../../shared/components/SafeTouchable';
import { FieldLabel } from '../../../shared/components/FieldLabel';
import { PasswordInput } from '../../../shared/components/PasswordInput';
import { useBackHandler } from '../../../shared/hooks/useBackHandler';
import {
  FormScrollView,
  FormTextInput,
} from '../../../shared/components/FormScrollView';
import { dismissKeyboardAnd } from '../../../shared/utils/keyboard';
import { useSingleFlight } from '../../../shared/hooks/useSingleFlight';
import { palette } from '../../../shared/theme/colors';

function AuthField({ label, secret = false, hasError, inputRef, ...props }) {
  const field = secret ? (
    <PasswordInput
      inputRef={inputRef}
      placeholder={label}
      containerStyle={[styles.passwordBox, hasError && styles.inputError]}
      {...props}
    />
  ) : (
    <FormTextInput
      ref={inputRef}
      placeholder={label}
      placeholderTextColor="#888"
      selectionColor={palette.primary}
      style={[styles.input, hasError && styles.inputError]}
      {...props}
    />
  );

  return (
    <>
      <FieldLabel required style={styles.fieldLabel}>
        {label}
      </FieldLabel>
      {field}
    </>
  );
}

AuthField.propTypes = {
  label: PropTypes.string.isRequired,
  secret: PropTypes.bool,
  hasError: PropTypes.bool.isRequired,
  inputRef: PropTypes.object,
};

export function AuthForm({
  title,
  subtitle,
  submitLabel,
  onSubmit,
  usuario,
  setUsuario,
  senha,
  setSenha,
  errorMessage,
  onBack,
  children,
}) {
  const passwordRef = useRef(null);
  useBackHandler(dismissKeyboardAnd(onBack));
  const submit = useSingleFlight(dismissKeyboardAnd(onSubmit));
  const hasError = Boolean(errorMessage);

  return (
    <FormScrollView
      style={styles.keyboardContainer}
      contentContainerStyle={styles.container}
    >
      <Image
        source={require('../../../../assets/adaptive-icon.png')}
        style={styles.logo}
        contentFit="contain"
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      <AuthField
        label="E-mail"
        testID="input-email"
        hasError={hasError}
        value={usuario}
        onChangeText={setUsuario}
        autoCapitalize="none"
        keyboardType="email-address"
        caretHidden={false}
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />

      <AuthField
        label="Senha"
        inputRef={passwordRef}
        testID="input-password"
        secret
        hasError={hasError}
        value={senha}
        onChangeText={setSenha}
        returnKeyType="done"
        onSubmitEditing={submit}
      />

      <SafeTouchable
        testID="button-submit-auth"
        style={styles.button}
        onPress={submit}
      >
        <Text style={styles.buttonText}>{submitLabel}</Text>
      </SafeTouchable>

      {children}

      <SafeTouchable
        style={styles.backButton}
        onPress={dismissKeyboardAnd(onBack)}
      >
        <Text style={styles.backButtonText}>Voltar</Text>
      </SafeTouchable>
    </FormScrollView>
  );
}

AuthForm.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  submitLabel: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired,
  usuario: PropTypes.string.isRequired,
  setUsuario: PropTypes.func.isRequired,
  senha: PropTypes.string.isRequired,
  setSenha: PropTypes.func.isRequired,
  errorMessage: PropTypes.string,
  onBack: PropTypes.func.isRequired,
  children: PropTypes.node,
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
  fieldLabel: { marginTop: 0 },
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
  passwordBox: {
    height: 50,
    paddingLeft: 4,
    marginBottom: 12,
    borderColor: palette.neutral,
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
