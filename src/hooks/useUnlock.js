import { useCallback, useEffect, useState } from 'react';
import { biometricService } from '../services/biometrics';
import { sessionService } from '../services/session';

// Confirma a identidade de quem reabre o app com uma sessão salva:
// o dono da biometria usa digital/rosto; as demais contas usam a senha.
export function useUnlock(usuario, onUnlocked) {
  const [canUseBiometrics, setCanUseBiometrics] = useState(false);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const unlockWithBiometrics = useCallback(async () => {
    setErrorMessage('');
    const result = await biometricService.authenticate(
      'Confirme sua identidade para entrar'
    );
    if (result.success) {
      onUnlocked();
    } else if (result.error && result.error !== 'user_cancel') {
      setErrorMessage('Biometria não reconhecida. Use sua senha.');
    }
  }, [onUnlocked]);

  useEffect(() => {
    let active = true;

    const prepare = async () => {
      try {
        const [owner, isAvailable] = await Promise.all([
          sessionService.getBiometricOwner(),
          biometricService.checkAvailability(),
        ]);
        const isOwner = isAvailable && owner?.usuario === usuario;
        if (!active || !isOwner) return;

        setCanUseBiometrics(true);
        // Já abre o pedido de biometria ao entrar na tela
        await unlockWithBiometrics();
      } catch {
        // Sem biometria disponível: a pessoa entra com a senha
      }
    };
    prepare();

    return () => {
      active = false;
    };
    // Executa apenas ao abrir a tela
  }, []);

  const unlockWithPassword = async () => {
    setErrorMessage('');
    if (!password) {
      setErrorMessage('Digite sua senha.');
      return;
    }

    try {
      const credentials = await sessionService.getCredentials(usuario);
      const isValid = await sessionService.verifyPassword(
        password,
        credentials?.passwordHash
      );
      if (!isValid) {
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
