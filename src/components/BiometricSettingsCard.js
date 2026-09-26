import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeTouchable } from './SafeTouchable';
import PasswordPromptModal from './PasswordPromptModal';
import { useAppAlert } from './AppAlert';
import {
  useBiometricSettings,
  BIOMETRIC_STATUS,
} from '../hooks/useBiometricSettings';
import { maskEmail } from '../utils/maskEmail';
import { palette } from '../theme/colors';

const STATUS_TEXT = {
  [BIOMETRIC_STATUS.LOADING]: 'Verificando...',
  [BIOMETRIC_STATUS.UNAVAILABLE]:
    'Este celular não tem digital ou rosto cadastrado nas configurações.',
  [BIOMETRIC_STATUS.AVAILABLE]:
    'Entre mais rápido usando a digital ou o rosto cadastrado neste celular.',
  [BIOMETRIC_STATUS.ACTIVE]: 'Ativada nesta conta.',
};

const PROMPT_TEXT = {
  activate: {
    title: 'Ativar biometria',
    message:
      'Atenção: qualquer digital ou rosto cadastrado neste celular poderá entrar nesta conta. Digite sua senha para continuar.',
  },
  deactivate: {
    title: 'Desativar biometria',
    message: 'Digite sua senha para desativar a biometria desta conta.',
  },
};

export function BiometricSettingsCard() {
  const showAlert = useAppAlert();
  const { status, owner, verifyPassword, activate, deactivate } =
    useBiometricSettings();
  // Ação que aguarda a senha: 'activate', 'deactivate' ou null
  const [pendingAction, setPendingAction] = useState(null);
  // Mantém o texto do pedido de senha enquanto ele fecha
  const [promptAction, setPromptAction] = useState('activate');
  const [passwordError, setPasswordError] = useState('');

  const statusText =
    status === BIOMETRIC_STATUS.TAKEN
      ? `A biometria deste celular já está em uso pela conta ${maskEmail(
          owner
        )}. Só uma conta por celular pode usar a biometria.`
      : STATUS_TEXT[status];

  const openPasswordPrompt = (action) => {
    setPromptAction(action);
    setPendingAction(action);
  };

  const closePasswordPrompt = () => {
    setPasswordError('');
    setPendingAction(null);
  };

  const runActivate = async () => {
    const result = await activate();
    if (result === 'activated') {
      showAlert({
        type: 'success',
        title: 'Biometria ativada',
        message: 'Da próxima vez, você poderá entrar com a biometria.',
      });
    } else if (result === 'failed') {
      showAlert({
        type: 'warning',
        title: 'Biometria não confirmada',
        message: 'Não foi possível confirmar a biometria. Tente novamente.',
      });
    }
  };

  const runDeactivate = async () => {
    await deactivate();
    showAlert({
      type: 'success',
      title: 'Biometria desativada',
      message:
        'Esta conta passará a entrar só com a senha. Outra conta deste celular poderá ativar a biometria.',
    });
  };

  const handleConfirmPassword = async (password) => {
    if (!password.trim()) {
      setPasswordError('Digite sua senha atual.');
      return false;
    }

    try {
      if (!(await verifyPassword(password))) {
        setPasswordError('Senha incorreta. Tente novamente.');
        return false;
      }
      const action = pendingAction;
      closePasswordPrompt();
      await (action === 'activate' ? runActivate() : runDeactivate());
      return true;
    } catch (error) {
      closePasswordPrompt();
      showAlert({
        type: 'danger',
        title: 'Não foi possível concluir',
        message: error.message,
      });
      return true;
    }
  };

  return (
    <View testID="biometric-settings" style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="finger-print" size={22} color={palette.primary} />
        <Text style={styles.title}>Biometria</Text>
      </View>
      <Text style={styles.statusText}>{statusText}</Text>

      {status === BIOMETRIC_STATUS.AVAILABLE ? (
        <SafeTouchable
          testID="button-activate-biometrics"
          style={styles.button}
          onPress={() => openPasswordPrompt('activate')}
        >
          <Text style={styles.buttonText}>Ativar biometria</Text>
        </SafeTouchable>
      ) : null}

      {status === BIOMETRIC_STATUS.ACTIVE ? (
        <SafeTouchable
          testID="button-deactivate-biometrics"
          style={[styles.button, styles.deactivateButton]}
          onPress={() => openPasswordPrompt('deactivate')}
        >
          <Text style={[styles.buttonText, styles.deactivateText]}>
            Desativar biometria
          </Text>
        </SafeTouchable>
      ) : null}

      <PasswordPromptModal
        visible={pendingAction !== null}
        {...PROMPT_TEXT[promptAction]}
        errorMessage={passwordError}
        onCancel={closePasswordPrompt}
        onConfirm={handleConfirmPassword}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 24,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: palette.surface,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 16, fontWeight: 'bold', color: palette.text },
  statusText: {
    fontSize: 13,
    color: palette.textMuted,
    marginTop: 8,
    lineHeight: 18,
  },
  button: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: palette.primary,
  },
  buttonText: { color: palette.white, fontWeight: 'bold', fontSize: 15 },
  deactivateButton: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.error,
  },
  deactivateText: { color: palette.error },
});
