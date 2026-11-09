import { biometricService } from '../services/biometrics';
import { accountService } from '../services/accountService';
import { useAppAlert } from '../../../shared/components/AppAlert';
import { usePasswordPrompt } from './usePasswordPrompt';
import { maskEmail } from '../../../shared/utils/maskEmail';
import { normalizeEmail } from '../../../shared/utils/validation';

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

async function activateBiometrics(usuario, password) {
  try {
    const result = await biometricService.authenticate(
      'Confirme sua biometria para ativá-la nesta conta'
    );
    if (result.error === 'user_cancel') return null;
    if (!result.success) return ALERTS.notConfirmed;

    await accountService.setBiometrics(usuario, true, password);
    return ALERTS.activated;
  } catch {
    return ALERTS.failed;
  }
}

const isSameAccount = (owner, usuario) =>
  owner !== null && normalizeEmail(owner) === normalizeEmail(usuario);

async function findOffer(usuario) {
  try {
    const [isAvailable, owner] = await Promise.all([
      biometricService.checkAvailability(),
      accountService.getBiometricOwner(),
    ]);
    const ownerUser = owner?.usuario || null;
    const canOffer = isAvailable && !isSameAccount(ownerUser, usuario);
    return canOffer ? { previousOwner: ownerUser } : null;
  } catch {
    return null;
  }
}

function offerMessage(previousOwner) {
  const message =
    'Quer entrar mais rápido nas próximas vezes? Ative a biometria. Atenção: qualquer digital ou rosto cadastrado neste celular poderá entrar nesta conta.';
  if (!previousOwner) return message;
  return `${message} A biometria deixará de entrar na conta ${maskEmail(
    previousOwner
  )}.`;
}

export function useBiometricOffer() {
  const showAlert = useAppAlert();
  const prompt = usePasswordPrompt({
    verify: (password, usuario) =>
      accountService.checkPassword(usuario, password),
    onConfirmed: async (usuario, password) => {
      const alert = await activateBiometrics(usuario, password);
      if (alert) showAlert(alert);
    },
  });

  const offerBiometrics = async (usuario, title) => {
    const offer = await findOffer(usuario);
    if (!offer) return false;

    showAlert({
      type: 'info',
      title,
      message: offerMessage(offer.previousOwner),
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
