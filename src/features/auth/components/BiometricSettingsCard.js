import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeTouchable } from '../../../shared/components/SafeTouchable';
import PasswordPromptModal from '../../../shared/components/PasswordPromptModal';
import { useAppAlert } from '../../../shared/components/AppAlert';
import {
  useBiometricSettings,
  BIOMETRIC_STATUS,
} from '../hooks/useBiometricSettings';
import { usePasswordPrompt } from '../hooks/usePasswordPrompt';
import { maskEmail } from '../../../shared/utils/maskEmail';
import { palette } from '../../../shared/theme/colors';

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

// Botão exibido em cada situação (as demais só mostram o texto)
const STATUS_ACTION = {
  [BIOMETRIC_STATUS.AVAILABLE]: {
    action: 'activate',
    label: 'Ativar biometria',
    testID: 'button-activate-biometrics',
  },
  [BIOMETRIC_STATUS.ACTIVE]: {
    action: 'deactivate',
    label: 'Desativar biometria',
    testID: 'button-deactivate-biometrics',
    danger: true,
  },
};

const ACTIVATION_ALERTS = {
  activated: {
    type: 'success',
    title: 'Biometria ativada',
    message: 'Da próxima vez, você poderá entrar com a biometria.',
  },
  failed: {
    type: 'warning',
    title: 'Biometria não confirmada',
    message: 'Não foi possível confirmar a biometria. Tente novamente.',
  },
};

const DEACTIVATED_ALERT = {
  type: 'success',
  title: 'Biometria desativada',
  message:
    'Esta conta passará a entrar só com a senha. Outra conta deste celular poderá ativar a biometria.',
};

function getStatusText(status, owner) {
  if (status !== BIOMETRIC_STATUS.TAKEN) return STATUS_TEXT[status];
  return `A biometria deste celular já está em uso pela conta ${maskEmail(
    owner
  )}. Só uma conta por celular pode usar a biometria.`;
}

export function BiometricSettingsCard() {
  const showAlert = useAppAlert();
  const { status, owner, activate, deactivate } = useBiometricSettings();

  // Cada ação devolve o aviso a exibir (ou nada, se a pessoa cancelou)
  const actions = {
    activate: async () => ACTIVATION_ALERTS[await activate()],
    deactivate: async () => {
      await deactivate();
      return DEACTIVATED_ALERT;
    },
  };

  const prompt = usePasswordPrompt({
    onConfirmed: async (action) => {
      try {
        const alert = await actions[action]();
        if (alert) showAlert(alert);
      } catch (error) {
        showAlert({
          type: 'danger',
          title: 'Não foi possível concluir',
          message: error.message,
        });
      }
    },
  });

  const statusAction = STATUS_ACTION[status];

  return (
    <View testID="biometric-settings" style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="finger-print" size={22} color={palette.primary} />
        <Text style={styles.title}>Biometria</Text>
      </View>
      <Text style={styles.statusText}>{getStatusText(status, owner)}</Text>

      {statusAction ? (
        <SafeTouchable
          testID={statusAction.testID}
          style={[styles.button, statusAction.danger && styles.dangerButton]}
          onPress={() => prompt.open(statusAction.action)}
        >
          <Text
            style={[
              styles.buttonText,
              statusAction.danger && styles.dangerText,
            ]}
          >
            {statusAction.label}
          </Text>
        </SafeTouchable>
      ) : null}

      <PasswordPromptModal
        {...PROMPT_TEXT[prompt.payload || 'activate']}
        {...prompt.promptProps}
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
  dangerButton: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.error,
  },
  dangerText: { color: palette.error },
});
