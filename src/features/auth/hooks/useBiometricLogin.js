import { useCallback, useEffect, useState } from 'react';
import { biometricService } from '../services/biometrics';
import { accountService } from '../services/accountService';
import { signInWithBiometrics } from '../services/signInService';

const BIOMETRIC_PASSWORD_CHANGED =
  'A senha desta conta mudou. Entre com a senha para voltar a usar a biometria.';

async function confirmBiometrics() {
  const owner = await accountService.getBiometricOwner();
  if (!owner) return { error: 'Nenhuma conta com biometria neste aparelho.' };

  const result = await biometricService.authenticate(
    'Autentique-se com sua biometria'
  );
  if (result.success) return { usuario: owner.usuario };
  const failed = result.error && result.error !== 'user_cancel';
  return { error: failed ? 'Biometria não reconhecida.' : '' };
}

export function useBiometricLogin(onSuccess, setErrorMessage) {
  const [hasHardwareBiometric, setHasHardwareBiometric] = useState(false);
  const [biometricOwner, setBiometricOwner] = useState(null);

  const checkBiometricSupport = useCallback(async () => {
    const isAvailable = await biometricService.checkAvailability();
    setHasHardwareBiometric(isAvailable);
    try {
      const owner = await accountService.getBiometricOwner();
      setBiometricOwner(owner?.usuario || null);
    } catch {
      setBiometricOwner(null);
    }
  }, []);

  useEffect(() => {
    checkBiometricSupport();
  }, [checkBiometricSupport]);

  const triggerBiometricAuth = async () => {
    setErrorMessage('');
    try {
      const confirmation = await confirmBiometrics();
      if (!confirmation.usuario) {
        setErrorMessage(confirmation.error);
        return;
      }
      const usuarioConta = await signInWithBiometrics();
      if (!usuarioConta) {
        setErrorMessage(BIOMETRIC_PASSWORD_CHANGED);
        return;
      }
      onSuccess?.({ type: 'biometric', usuario: usuarioConta });
    } catch (error) {
      setErrorMessage(error.message || 'Erro ao entrar com a biometria.');
    }
  };

  return {
    hasHardwareBiometric,
    biometricOwner,
    canUse: hasHardwareBiometric && Boolean(biometricOwner),
    triggerBiometricAuth,
  };
}
