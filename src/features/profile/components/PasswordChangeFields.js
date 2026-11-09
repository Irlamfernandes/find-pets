import React, { useRef } from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';
import { PasswordInput } from '../../../shared/components/PasswordInput';
import { FieldLabel } from '../../../shared/components/FieldLabel';
import { formStyles } from '../../../shared/theme/formStyles';

function ConfirmPasswordField({
  inputRef,
  value,
  isVisible,
  mismatch,
  onChange,
  onToggleVisibility,
  onSubmit,
}) {
  return (
    <>
      <FieldLabel required>Confirmar nova senha</FieldLabel>
      <PasswordInput
        inputRef={inputRef}
        testID="input-confirm-password"
        containerStyle={mismatch && formStyles.inputError}
        isVisible={isVisible}
        onToggleVisibility={onToggleVisibility}
        toggleTestID="button-toggle-confirm-visibility"
        value={value}
        onChangeText={onChange}
        placeholder="Digite a nova senha novamente"
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
  onToggleVisibility: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

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
      <PasswordInput
        inputRef={newPasswordRef}
        testID="input-new-password"
        isVisible={isVisible}
        onToggleVisibility={onToggleVisibility}
        value={newPassword}
        onChangeText={(text) => onChange('newPassword', text)}
        placeholder="Digite uma nova senha se desejar alterar"
        {...submitProps}
      />

      {hasNewPassword ? (
        <ConfirmPasswordField
          inputRef={confirmRef}
          value={confirmPassword}
          isVisible={isVisible}
          mismatch={mismatch}
          onToggleVisibility={onToggleVisibility}
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
