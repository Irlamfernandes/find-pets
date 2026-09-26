import React from 'react';
import { Modal, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SafeTouchable } from './SafeTouchable';
import { palette } from '../theme/colors';

// Lista de ações que sobe da parte de baixo da tela
export function OptionsSheet({ visible, title, options, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        testID="options-sheet-backdrop"
        style={styles.overlay}
        onPress={onClose}
      >
        <Pressable style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          {options.map((option) => (
            <SafeTouchable
              key={option.label}
              style={styles.option}
              onPress={() => {
                onClose();
                option.onPress();
              }}
            >
              <Ionicons
                name={option.icon}
                size={22}
                color={option.destructive ? palette.error : palette.primary}
              />
              <Text
                style={[
                  styles.optionText,
                  option.destructive && styles.destructiveText,
                ]}
              >
                {option.label}
              </Text>
            </SafeTouchable>
          ))}
          <SafeTouchable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </SafeTouchable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

OptionsSheet.propTypes = {
  visible: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
      onPress: PropTypes.func.isRequired,
      destructive: PropTypes.bool,
    })
  ).isRequired,
  onClose: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: palette.text,
    marginBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: palette.cardBorder,
  },
  optionText: { fontSize: 16, color: palette.text },
  destructiveText: { color: palette.error },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: palette.background,
  },
  cancelText: { fontSize: 16, fontWeight: 'bold', color: palette.text },
});
