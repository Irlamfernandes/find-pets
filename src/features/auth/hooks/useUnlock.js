import { useEffect, useState } from 'react';
import { useLatestCallback } from '../../../shared/hooks/useLatestCallback';
import { biometricService } from '../services/biometrics';
import { accountService } from '../services/accountService';

export function useUnlock(usuario, onUnlocked) {
  const [canUseBiometrics, setCanUseBiometrics] = useState(false);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const unlockWithBiometrics = useLatestCallback(async () => {
    setErrorMessage('');
    const result = await biometricService.authenticate(
      'Confirme sua identidade para entrar'
    );
    if (result.success) {
      onUnlocked();
    } else if (result.error && result.error !== 'user_cancel') {
      setErrorMessage('Biometria não reconhecida. Use sua senha.');
    }
  });

  useEffect(() => {
    let active = true;

    const prepare = async () => {
      const [owner, isAvailable] = await Promise.all([
        accountService.getBiometricOwner(),
        biometricService.checkAvailability(),
      ]);
      const isOwner = isAvailable && owner?.usuario === usuario;
      if (!active || !isOwner) return;

      setCanUseBiometrics(true);
      await unlockWithBiometrics();
    };
    prepare().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [usuario, unlockWithBiometrics]);

  const unlockWithPassword = async () => {
    setErrorMessage('');
    if (!password) {
      setErrorMessage('Digite sua senha.');
      return;
    }

    try {
      if (!(await accountService.checkPassword(usuario, password))) {
        setErrorMessage('Senha incorreta.');
        return;
      }
      onUnlocked();
    } catch {
      setErrorMessage('Não foi possível verificar a senha agora.');
    }
  };

  return {
    canUseBiometrics,
    password,
    setPassword,
    errorMessage,
    unlockWithBiometrics,
    unlockWithPassword,
  };
}
