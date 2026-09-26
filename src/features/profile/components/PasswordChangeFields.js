import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SafeTouchable } from '../../../shared/components/SafeTouchable';
import { FormTextInput } from '../../../shared/components/FormScrollView';
import { formStyles } from '../../../shared/theme/formStyles';
import { palette } from '../../../shared/theme/colors';

const secretInputProps = {
  autoCapitalize: 'none',
  autoCorrect: false,
  selectionColor: palette.primary,
};

function VisibilityToggle({ isVisible, onToggle }) {
  return (
    <SafeTouchable
      testID="button-toggle-password-visibility"
      accessibilityLabel={isVisible ? 'Ocultar senha' : 'Mostrar senha'}
      style={styles.toggle}
      onPress={onToggle}
    >
      <Ionicons
        name={isVisible ? 'eye-off-outline' : 'eye-outline'}
        size={22}
        color={palette.textMuted}
      />
    </SafeTouchable>
  );
}

VisibilityToggle.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

function ConfirmPasswordField({
  inputRef,
  value,
  isVisible,
  mismatch,
  onChange,
  onSubmit,
}) {
  return (
    <>
      <Text style={formStyles.label}>Confirmar nova senha</Text>
      <FormTextInput
        ref={inputRef}
        style={[formStyles.input, mismatch && formStyles.inputError]}
        value={value}
        onChangeText={onChange}
        placeholder="Digite a nova senha novamente"
        secureTextEntry={!isVisible}
        {...secretInputProps}
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />
      {mismatch ? (
        <Text style={formStyles.fieldError}>As senhas não conferem.</Text>
      ) : null}
    </>
  );
}

ConfirmPasswordField.propTypes = {
  inputRef: PropTypes.object.isRequired,
  value: PropTypes.string.isRequired,
  isVisible: PropTypes.bool.isRequired,
  mismatch: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

// Nova senha (opcional) e, depois de digitada, a confirmação. Com a nova
// senha preenchida, o teclado leva à confirmação; sem ela, salva.
export function PasswordChangeFields({
  newPasswordRef,
  newPassword,
  confirmPassword,
  isVisible,
  mismatch,
  onChange,
  onToggleVisibility,
  onSubmit,
}) {
  const confirmRef = useRef(null);
  const hasNewPassword = Boolean(newPassword);
  const submitProps = hasNewPassword
    ? {
        returnKeyType: 'next',
        submitBehavior: 'submit',
        onSubmitEditing: () => confirmRef.current?.focus(),
      }
    : {
        returnKeyType: 'done',
        submitBehavior: 'blurAndSubmit',
        onSubmitEditing: onSubmit,
      };

  return (
    <>
      <Text style={formStyles.label}>Nova Senha (Opcional)</Text>
      <View style={styles.passwordContainer}>
        <FormTextInput
          ref={newPasswordRef}
          style={styles.passwordInput}
          value={newPassword}
          onChangeText={(text) => onChange('newPassword', text)}
          placeholder="Digite uma nova senha se desejar alterar"
          secureTextEntry={!isVisible}
          {...secretInputProps}
          {...submitProps}
        />
        <VisibilityToggle isVisible={isVisible} onToggle={onToggleVisibility} />
      </View>

      {hasNewPassword ? (
        <ConfirmPasswordField
          inputRef={confirmRef}
          value={confirmPassword}
          isVisible={isVisible}
          mismatch={mismatch}
          onChange={(text) => onChange('confirmPassword', text)}
          onSubmit={onSubmit}
        />
      ) : null}
    </>
  );
}

PasswordChangeFields.propTypes = {
  newPasswordRef: PropTypes.object.isRequired,
  newPassword: PropTypes.string.isRequired,
  confirmPassword: PropTypes.string.isRequired,
  isVisible: PropTypes.bool.isRequired,
  mismatch: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  onToggleVisibility: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 12,
  },
  passwordInput: { flex: 1, padding: 12, fontSize: 16, color: palette.text },
  toggle: { paddingHorizontal: 12, paddingVertical: 10 },
});
