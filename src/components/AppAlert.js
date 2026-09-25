import React, { createContext, useContext, useState, useCallback } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../theme/colors';

const AlertContext = createContext(null);

const alertStyles = {
  info: {
    icon: 'information-circle-outline',
    color: palette.primary,
    backgroundColor: palette.primarySoft,
  },
  success: {
    icon: 'checkmark-circle-outline',
    color: palette.success,
    backgroundColor: '#D1FAE5',
  },
  warning: {
    icon: 'alert-circle-outline',
    color: palette.accent,
    backgroundColor: palette.accentSoft,
  },
  danger: {
    icon: 'trash-outline',
    color: palette.error,
    backgroundColor: '#FEE2E2',
  },
};

export function nativeAlert({
  title,
  message,
  confirmText = 'Entendi',
  cancelText,
  onConfirm,
}) {
  return new Promise((resolve) => {
    if (!cancelText && !onConfirm) {
      Alert.alert(title, message);
      return;
    }

    const buttons = [];
    if (cancelText) {
      buttons.push({
        text: cancelText,
        style: 'cancel',
        onPress: () => resolve(false),
      });
    }
    buttons.push({
      text: confirmText,
      style: 'default',
      onPress: () => {
        onConfirm?.();
        resolve(true);
      },
    });
    Alert.alert(title, message, buttons);
  });
}

export function AppAlertProvider({ children }) {
  const [alert, setAlert] = useState(null);

  const showAlert = useCallback((options) => {
    return new Promise((resolve) => {
      setAlert({ ...options, resolve });
    });
  }, []);

  const closeAlert = (confirmed) => {
    if (!alert) return;
    if (confirmed) alert.onConfirm?.();
    alert.resolve(confirmed);
    setAlert(null);
  };

  const style = alertStyles[alert?.type || 'info'];

  return (
    <AlertContext.Provider value={showAlert}>
      {children}
      <Modal
        transparent
        visible={!!alert}
        animationType="fade"
        onRequestClose={() => closeAlert(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: style.backgroundColor },
              ]}
            >
              <Ionicons name={style.icon} size={28} color={style.color} />
            </View>
            <Text style={styles.title}>{alert?.title}</Text>
            <Text style={styles.message}>{alert?.message}</Text>
            <View style={styles.actions}>
              {alert?.cancelText ? (
                <Pressable
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => closeAlert(false)}
                >
                  <Text style={styles.cancelText}>{alert.cancelText}</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={[styles.button, { backgroundColor: style.color }]}
                onPress={() => closeAlert(true)}
              >
                <Text style={styles.confirmText}>
                  {alert?.confirmText || 'Entendi'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
}

export function useAppAlert() {
  return useContext(AlertContext) || nativeAlert;
}

AppAlertProvider.propTypes = {
  children: require('prop-types').node.isRequired,
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    padding: 24,
    borderRadius: 24,
    backgroundColor: palette.surface,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: palette.text,
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
  },
  actions: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  button: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  cancelButton: {
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  cancelText: {
    color: palette.textMuted,
    fontWeight: '700',
  },
  confirmText: {
    color: palette.white,
    fontWeight: '700',
  },
});
