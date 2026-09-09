// src/screens/LoginScreen.js
import React from 'react';
import PropTypes from 'prop-types';
import { useLogin } from '../hooks/useLogin';
import { AuthHomeScreen } from './auth/AuthHomeScreen';
import { AuthLoginScreen } from './auth/AuthLoginScreen';
import { AuthRegisterScreen } from './auth/AuthRegisterScreen';

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

  if (authMode === 'home') {
    return <AuthHomeScreen onNavigate={setAuthMode} />;
  }

  if (authMode === 'cadastro') {
    return (
      <AuthRegisterScreen
        usuario={usuario}
        setUsuario={setUsuario}
        senha={senha}
        setSenha={setSenha}
        errorMessage={errorMessage}
        handleRegister={handleRegister}
        onBack={() => setAuthMode('home')}
      />
    );
  }

  return (
    <AuthLoginScreen
      usuario={usuario}
      setUsuario={setUsuario}
      senha={senha}
      setSenha={setSenha}
      hasHardwareBiometric={hasHardwareBiometric}
      errorMessage={errorMessage}
      handleManualLogin={handleManualLogin}
      triggerBiometricAuth={triggerBiometricAuth}
      onBack={() => setAuthMode('home')}
    />
  );
}

LoginScreen.propTypes = {
  onLoginSuccess: PropTypes.func.isRequired,
};
