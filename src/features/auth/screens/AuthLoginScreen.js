import React from 'react';
import { Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { AuthForm } from '../components/AuthForm';
import { SafeTouchable } from '../../../shared/components/SafeTouchable';
import { dismissKeyboardAnd } from '../../../shared/utils/keyboard';
import { palette } from '../../../shared/theme/colors';
import { maskEmail } from '../../../shared/utils/maskEmail';

export function AuthLoginScreen({
  hasHardwareBiometric,
  biometricOwner,
  handleManualLogin,
  triggerBiometricAuth,
  ...formProps
}) {
  return (
    <AuthForm
      {...formProps}
      title="Login"
      subtitle="Entre com sua conta"
      submitLabel="Entrar com Senha"
      onSubmit={handleManualLogin}
    >
      {hasHardwareBiometric && biometricOwner ? (
        <SafeTouchable
          style={styles.biometricButton}
          onPress={dismissKeyboardAnd(triggerBiometricAuth)}
        >
          <Text style={styles.biometricButtonText}>Entrar com Biometria</Text>
          <Text style={styles.biometricOwnerText}>
            {maskEmail(biometricOwner)}
          </Text>
        </SafeTouchable>
      ) : null}
    </AuthForm>
  );
}

AuthLoginScreen.propTypes = {
  usuario: PropTypes.string.isRequired,
  setUsuario: PropTypes.func.isRequired,
  senha: PropTypes.string.isRequired,
  setSenha: PropTypes.func.isRequired,
  hasHardwareBiometric: PropTypes.bool.isRequired,
  biometricOwner: PropTypes.string,
  errorMessage: PropTypes.string,
  handleManualLogin: PropTypes.func.isRequired,
  triggerBiometricAuth: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  biometricButton: {
    minHeight: 56,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: palette.primarySoft,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: palette.primarySoft,
  },
  biometricOwnerText: {
    color: palette.primary,
    fontSize: 12,
    marginTop: 2,
  },
  biometricButtonText: {
    color: palette.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
