import { useCallback, useEffect, useState } from 'react';
import { biometricService } from '../services/biometrics';
import { sessionService } from '../services/session';

// Estados possíveis da biometria para a conta logada
export const BIOMETRIC_STATUS = {
  LOADING: 'loading',
  UNAVAILABLE: 'unavailable', // celular sem leitor ou sem biometria cadastrada
  AVAILABLE: 'available', // nenhuma conta usa: esta conta pode ativar
  ACTIVE: 'active', // ativada nesta conta
  TAKEN: 'taken', // já pertence a outra conta deste celular
};

export function useBiometricSettings() {
  const [usuario, setUsuario] = useState(null);
  const [owner, setOwner] = useState(null);
  const [status, setStatus] = useState(BIOMETRIC_STATUS.LOADING);

  const refresh = useCallback(async () => {
    try {
      const [session, isAvailable, biometricOwner] = await Promise.all([
        sessionService.getSession(),
        biometricService.checkAvailability(),
        sessionService.getBiometricOwner(),
      ]);
      const currentUser = session?.usuario || null;
      const ownerUser = biometricOwner?.usuario || null;
      setUsuario(currentUser);
      setOwner(ownerUser);

      if (ownerUser && ownerUser === currentUser) {
        setStatus(BIOMETRIC_STATUS.ACTIVE);
      } else if (ownerUser) {
        setStatus(BIOMETRIC_STATUS.TAKEN);
      } else if (isAvailable) {
        setStatus(BIOMETRIC_STATUS.AVAILABLE);
      } else {
        setStatus(BIOMETRIC_STATUS.UNAVAILABLE);
      }
    } catch {
      setStatus(BIOMETRIC_STATUS.UNAVAILABLE);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const verifyPassword = async (password) => {
    const credentials = await sessionService.getCredentials(usuario);
    return sessionService.verifyPassword(password, credentials?.passwordHash);
  };

  // Retorna 'activated', 'cancelled' ou 'failed'
  const activate = async () => {
    const result = await biometricService.authenticate(
      'Confirme sua biometria para ativá-la nesta conta'
    );
    if (!result.success) {
      return result.error === 'user_cancel' ? 'cancelled' : 'failed';
    }
    await sessionService.setBiometrics(usuario, true);
    await refresh();
    return 'activated';
  };

  const deactivate = async () => {
    await sessionService.setBiometrics(usuario, false);
    await refresh();
  };

  return { status, owner, verifyPassword, activate, deactivate };
}
