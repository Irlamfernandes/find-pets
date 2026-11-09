import { useState } from 'react';
import { signIn, signUp } from '../services/signInService';
import { useBiometricLogin } from './useBiometricLogin';
import {
  rule,
  validate,
  isFilled,
  isValidEmail,
} from '../../../shared/utils/validation';

const credentialRules = [
  rule(
    ({ usuario, senha }) => isFilled(usuario) && isFilled(senha),
    'Preencha usuário e senha.'
  ),
  rule(
    ({ usuario }) => isValidEmail(usuario.trim()),
    'Insira um formato de e-mail válido.'
  ),
];

export function useLogin(onSuccess) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [authMode, setAuthMode] = useState('home');
  const biometrics = useBiometricLogin(onSuccess, setErrorMessage);

  const submitWith = (action, fallbackError) => async () => {
    setErrorMessage('');
    const invalid = validate({ usuario, senha }, credentialRules);
    if (invalid) {
      setErrorMessage(invalid);
      return;
    }

    try {
      const failure = await action(usuario.trim());
      if (failure) setErrorMessage(failure);
    } catch (error) {
      setErrorMessage(error.message || fallbackError);
    }
  };

  const handleRegister = submitWith(async (email) => {
    const usuarioConta = await signUp(email, senha);
    setUsuario('');
    setSenha('');
    await onSuccess?.({ type: 'register', usuario: usuarioConta });
  }, 'Erro ao realizar o cadastro.');

  const handleManualLogin = submitWith(async (email) => {
    const usuarioConta = await signIn(email, senha);
    if (!usuarioConta) return 'Usuário não existe ou senha errada.';
    await onSuccess?.({ type: 'credentials', usuario: usuarioConta });
  }, 'Erro ao realizar o login.');

  const navigate = (mode) => {
    setErrorMessage('');
    setAuthMode(mode);
    if (mode === 'login' && biometrics.canUse) {
      biometrics.triggerBiometricAuth();
    }
  };

  return {
    usuario,
    setUsuario,
    senha,
    setSenha,
    hasHardwareBiometric: biometrics.hasHardwareBiometric,
    biometricOwner: biometrics.biometricOwner,
    errorMessage,
    authMode,
    setAuthMode,
    navigate,
    handleRegister,
    handleManualLogin,
    triggerBiometricAuth: biometrics.triggerBiometricAuth,
  };
}
