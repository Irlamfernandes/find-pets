import { useCallback, useEffect, useState } from 'react';
import { biometricService } from '../services/biometrics';
import { accountService } from '../services/accountService';
import { sessionService } from '../services/sessionService';

// Estados possíveis da biometria para a conta logada
export const BIOMETRIC_STATUS = {
  LOADING: 'loading',
  UNAVAILABLE: 'unavailable', // celular sem leitor ou sem biometria cadastrada
  AVAILABLE: 'available', // nenhuma conta usa: esta conta pode ativar
  ACTIVE: 'active', // ativada nesta conta
  TAKEN: 'taken', // já pertence a outra conta deste celular
};

export function getBiometricStatus({ currentUser, ownerUser, isAvailable }) {
  if (ownerUser) {
    return ownerUser === currentUser
      ? BIOMETRIC_STATUS.ACTIVE
      : BIOMETRIC_STATUS.TAKEN;
  }
  return isAvailable
    ? BIOMETRIC_STATUS.AVAILABLE
    : BIOMETRIC_STATUS.UNAVAILABLE;
}

export function useBiometricSettings() {
  const [state, setState] = useState({
    usuario: null,
    owner: null,
    status: BIOMETRIC_STATUS.LOADING,
  });

  const refresh = useCallback(async () => {
    try {
      const [currentUser, isAvailable, owner] = await Promise.all([
        sessionService.getCurrentUser(),
        biometricService.checkAvailability(),
        accountService.getBiometricOwner(),
      ]);
      const ownerUser = owner?.usuario || null;
      setState({
        usuario: currentUser,
        owner: ownerUser,
        status: getBiometricStatus({ currentUser, ownerUser, isAvailable }),
      });
    } catch {
      setState((current) => ({
        ...current,
        status: BIOMETRIC_STATUS.UNAVAILABLE,
      }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Retorna 'activated', 'cancelled' ou 'failed'
  const activate = async () => {
    const result = await biometricService.authenticate(
      'Confirme sua biometria para ativá-la nesta conta'
    );
    if (!result.success) {
      return result.error === 'user_cancel' ? 'cancelled' : 'failed';
    }
    await accountService.setBiometrics(state.usuario, true);
    await refresh();
    return 'activated';
  };

  const deactivate = async () => {
    await accountService.setBiometrics(state.usuario, false);
    await refresh();
  };

  return { status: state.status, owner: state.owner, activate, deactivate };
}
