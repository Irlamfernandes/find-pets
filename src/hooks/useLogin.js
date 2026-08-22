import { useState, useEffect, useCallback } from 'react';
import { biometricService } from '../services/biometrics';

export function useLogin(onSuccess) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const checkBiometricSupport = useCallback(async () => {
    const isAvailable = await biometricService.checkAvailability();
    setHasBiometrics(isAvailable);
    if (isAvailable) {
      triggerBiometricAuth();
    }
  }, []);

  useEffect(() => {
    checkBiometricSupport();
  }, [checkBiometricSupport]);

  const triggerBiometricAuth = async () => {
    setErrorMessage('');
    const result = await biometricService.authenticate();
    if (result.success) {
      onSuccess?.({ type: 'biometric' });
    } else if (result.error && result.error !== 'user_cancel') {
      setErrorMessage('Falha na autenticação biométrica.');
    }
  };

  const handleManualLogin = () => {
    setErrorMessage('');
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Preencha e-mail e senha.');
      return;
    }
    onSuccess?.({ type: 'credentials', email });
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    hasBiometrics,
    errorMessage,
    handleManualLogin,
    triggerBiometricAuth,
  };
}
