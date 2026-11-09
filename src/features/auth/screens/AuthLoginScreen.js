import React from 'react';
import PropTypes from 'prop-types';
import { AuthForm } from '../components/AuthForm';
import { BiometricLoginButton } from '../components/BiometricLoginButton';

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
        <BiometricLoginButton
          testID="button-login-biometrics"
          owner={biometricOwner}
          onPress={triggerBiometricAuth}
        />
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
