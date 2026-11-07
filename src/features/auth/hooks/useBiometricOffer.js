import { biometricService } from '../services/biometrics';
import { accountService } from '../services/accountService';
import { useAppAlert } from '../../../shared/components/AppAlert';
import { usePasswordPrompt } from './usePasswordPrompt';

const ALERTS = {
  activated: {
    type: 'success',
    title: 'Biometria ativada',
    message: 'Da próxima vez, você poderá entrar com a biometria.',
  },
  notConfirmed: {
    type: 'warning',
    title: 'Biometria não confirmada',
    message: 'Você pode ativá-la depois, no seu Perfil.',
  },
  failed: {
    type: 'danger',
    title: 'Não foi possível ativar',
    message: 'Tente novamente depois, no seu Perfil.',
  },
};

async function activateBiometrics(usuario) {
  try {
    const result = await biometricService.authenticate(
      'Confirme sua biometria para ativá-la nesta conta'
    );
    if (result.error === 'user_cancel') return null;
    if (!result.success) return ALERTS.notConfirmed;

    await accountService.setBiometrics(usuario, true);
    return ALERTS.activated;
  } catch {
    return ALERTS.failed;
  }
}

async function canOfferBiometrics() {
  try {
    const [isAvailable, owner] = await Promise.all([
      biometricService.checkAvailability(),
      accountService.getBiometricOwner(),
    ]);
    return isAvailable && !owner;
  } catch {
    return false;
  }
}

export function useBiometricOffer() {
  const showAlert = useAppAlert();
  const prompt = usePasswordPrompt({
    verify: (password, usuario) =>
      accountService.checkPassword(usuario, password),
    onConfirmed: async (usuario) => {
      const alert = await activateBiometrics(usuario);
      if (alert) showAlert(alert);
    },
  });

  const offerBiometrics = async (usuario, name) => {
    if (!(await canOfferBiometrics())) return false;

    showAlert({
      type: 'info',
      title: `Tudo pronto, ${name}!`,
      message:
        'Quer entrar mais rápido nas próximas vezes? Ative a biometria. Atenção: qualquer digital ou rosto cadastrado neste celular poderá entrar nesta conta.',
      confirmText: 'Ativar agora',
      cancelText: 'Depois',
      onConfirm: () => prompt.open(usuario),
    });
    return true;
  };

  return {
    offerBiometrics,
    passwordPromptProps: {
      title: 'Ativar biometria',
      message: 'Digite a senha da sua conta para ativar a biometria.',
      ...prompt.promptProps,
    },
  };
}
