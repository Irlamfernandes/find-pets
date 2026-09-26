import React from 'react';
import { Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SafeTouchable } from '../../../shared/components/SafeTouchable';
import {
  FormScrollView,
  FormTextInput,
} from '../../../shared/components/FormScrollView';
import { dismissKeyboardAnd } from '../../../shared/utils/keyboard';
import { useSingleFlight } from '../../../shared/hooks/useSingleFlight';
import { useUnlock } from '../hooks/useUnlock';
import { palette } from '../../../shared/theme/colors';

export default function UnlockScreen({ usuario, onUnlocked, onSwitchAccount }) {
  const {
    canUseBiometrics,
    password,
    setPassword,
    errorMessage,
    unlockWithBiometrics,
    unlockWithPassword,
  } = useUnlock(usuario, onUnlocked);
  // Botão e tecla "concluir" compartilham a mesma trava
  const submitPassword = useSingleFlight(
    dismissKeyboardAnd(unlockWithPassword)
  );

  return (
    <FormScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
    >
      <Image
        source={require('../../../../assets/adaptive-icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Bem-vindo de volta</Text>
      <Text style={styles.subtitle}>
        Confirme que é você para entrar em{'\n'}
        <Text style={styles.email}>{usuario}</Text>
      </Text>

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      {canUseBiometrics ? (
        <SafeTouchable
          testID="button-unlock-biometrics"
          style={styles.biometricButton}
          onPress={dismissKeyboardAnd(unlockWithBiometrics)}
        >
          <Ionicons name="finger-print" size={22} color={palette.primary} />
          <Text style={styles.biometricButtonText}>Entrar com biometria</Text>
        </SafeTouchable>
      ) : null}

      <FormTextInput
        testID="input-unlock-password"
        style={styles.input}
        placeholder="Senha"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        selectionColor={palette.primary}
        returnKeyType="done"
        onSubmitEditing={submitPassword}
      />

      <SafeTouchable
        testID="button-unlock-password"
        style={styles.button}
        onPress={submitPassword}
      >
        <Text style={styles.buttonText}>Entrar com senha</Text>
      </SafeTouchable>

      <SafeTouchable
        style={styles.switchButton}
        onPress={dismissKeyboardAnd(onSwitchAccount)}
      >
        <Text style={styles.switchButtonText}>Trocar de conta</Text>
      </SafeTouchable>
    </FormScrollView>
  );
}

UnlockScreen.propTypes = {
  usuario: PropTypes.string.isRequired,
  onUnlocked: PropTypes.func.isRequired,
  onSwitchAccount: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  logo: { width: 72, height: 72, alignSelf: 'center', marginBottom: 12 },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: palette.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  email: { fontWeight: 'bold', color: palette.text },
  errorText: { color: palette.error, textAlign: 'center', marginBottom: 12 },
  biometricButton: {
    height: 52,
    flexDirection: 'row',
    gap: 8,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.primarySoft,
    marginBottom: 16,
  },
  biometricButtonText: {
    color: palette.primary,
    fontSize: 16,
    fontWeight: 'bold',
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
  },
  buttonText: { color: palette.white, fontSize: 16, fontWeight: 'bold' },
  switchButton: { marginTop: 20, alignItems: 'center' },
  switchButtonText: {
    color: palette.primary,
    fontSize: 15,
    fontWeight: 'bold',
  },
});
