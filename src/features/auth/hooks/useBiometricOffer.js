import { useState } from 'react';
import { biometricService } from '../services/biometrics';
import { sessionService } from '../services/session';
import { useAppAlert } from '../../../shared/components/AppAlert';

// Ao terminar o cadastro, convida a pessoa a ativar a biometria (se o
// celular tiver e nenhuma outra conta já a usar). Antes de ativar, pede a
// senha da conta. `offerBiometrics` retorna se o convite foi exibido, para
// quem chama não sobrepor outro aviso; `passwordPromptProps` vai para um
// PasswordPromptModal.
export function useBiometricOffer() {
  const showAlert = useAppAlert();
  const [pendingUser, setPendingUser] = useState(null);
  const [passwordError, setPasswordError] = useState('');

  const closePasswordPrompt = () => {
    setPasswordError('');
    setPendingUser(null);
  };

  const activate = async (usuario) => {
    try {
      const result = await biometricService.authenticate(
        'Confirme sua biometria para ativá-la nesta conta'
      );
      if (result.success) {
        await sessionService.setBiometrics(usuario, true);
        showAlert({
          type: 'success',
          title: 'Biometria ativada',
          message: 'Da próxima vez, você poderá entrar com a biometria.',
        });
      } else if (result.error !== 'user_cancel') {
        showAlert({
          type: 'warning',
          title: 'Biometria não confirmada',
          message: 'Você pode ativá-la depois, no seu Perfil.',
        });
      }
    } catch {
      showAlert({
        type: 'danger',
        title: 'Não foi possível ativar',
        message: 'Tente novamente depois, no seu Perfil.',
      });
    }
  };

  const confirmPassword = async (password) => {
    if (!password.trim()) {
      setPasswordError('Digite sua senha.');
      return false;
    }

    try {
      const credentials = await sessionService.getCredentials(pendingUser);
      const isValid = await sessionService.verifyPassword(
        password,
        credentials?.passwordHash
      );
      if (!isValid) {
        setPasswordError('Senha incorreta. Tente novamente.');
        return false;
      }
    } catch {
      setPasswordError('Não foi possível verificar a senha agora.');
      return false;
    }

    const usuario = pendingUser;
    closePasswordPrompt();
    await activate(usuario);
    return true;
  };

  const offerBiometrics = async (usuario, name) => {
    try {
      const [isAvailable, owner] = await Promise.all([
        biometricService.checkAvailability(),
        sessionService.getBiometricOwner(),
      ]);
      if (!isAvailable || owner) return false;
    } catch {
      return false;
    }

    showAlert({
      type: 'info',
      title: `Tudo pronto, ${name}!`,
      message:
        'Quer entrar mais rápido nas próximas vezes? Ative a biometria. Atenção: qualquer digital ou rosto cadastrado neste celular poderá entrar nesta conta.',
      confirmText: 'Ativar agora',
      cancelText: 'Depois',
      onConfirm: () => setPendingUser(usuario),
    });
    return true;
  };

  return {
    offerBiometrics,
    passwordPromptProps: {
      visible: pendingUser !== null,
      title: 'Ativar biometria',
      message: 'Digite a senha da sua conta para ativar a biometria.',
      errorMessage: passwordError,
      onCancel: closePasswordPrompt,
      onConfirm: confirmPassword,
    },
  };
}
