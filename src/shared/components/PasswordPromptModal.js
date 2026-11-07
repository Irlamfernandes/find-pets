import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SafeTouchable } from './SafeTouchable';
import { palette } from '../theme/colors';

export default function PasswordPromptModal({
  visible,
  title = 'Confirme sua senha',
  message = 'Digite sua senha atual para continuar.',
  errorMessage = '',
  isVerifying = false,
  onCancel,
  onConfirm,
}) {
  const [password, setPassword] = useState('');

  const handleCancel = () => {
    Keyboard.dismiss();
    setPassword('');
    onCancel();
  };

  const handleConfirm = async () => {
    Keyboard.dismiss();
    const confirmed = await onConfirm(password);
    if (confirmed) setPassword('');
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView style={styles.overlay} behavior="padding">
        <View style={styles.dialog}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={28}
              color={palette.primary}
            />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <TextInput
            testID="input-current-password"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Senha atual"
            secureTextEntry
            autoFocus
            selectionColor={palette.primary}
            returnKeyType="done"
            onSubmitEditing={handleConfirm}
          />

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <View style={styles.actions}>
            <SafeTouchable
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </SafeTouchable>
            <SafeTouchable
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
              disabled={isVerifying}
            >
              <Text style={styles.confirmText}>Confirmar</Text>
            </SafeTouchable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

PasswordPromptModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  errorMessage: PropTypes.string,
  isVerifying: PropTypes.bool,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: palette.surface,
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.primarySoft,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: palette.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    color: palette.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: palette.text,
  },
  errorText: {
    alignSelf: 'flex-start',
    color: palette.error,
    fontSize: 13,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: { backgroundColor: palette.background },
  confirmButton: { backgroundColor: palette.primary },
  cancelText: { color: palette.text, fontWeight: 'bold' },
  confirmText: { color: palette.white, fontWeight: 'bold' },
});
