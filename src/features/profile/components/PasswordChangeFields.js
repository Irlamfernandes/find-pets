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

// Nova senha (opcional) e, depois de digitada, a confirmação
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
          returnKeyType={hasNewPassword ? 'next' : 'done'}
          submitBehavior={hasNewPassword ? 'submit' : 'blurAndSubmit'}
          onSubmitEditing={
            hasNewPassword ? () => confirmRef.current?.focus() : onSubmit
          }
        />
        <SafeTouchable
          testID="button-toggle-password-visibility"
          accessibilityLabel={isVisible ? 'Ocultar senha' : 'Mostrar senha'}
          style={styles.toggle}
          onPress={onToggleVisibility}
        >
          <Ionicons
            name={isVisible ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={palette.textMuted}
          />
        </SafeTouchable>
      </View>

      {hasNewPassword ? (
        <>
          <Text style={formStyles.label}>Confirmar nova senha</Text>
          <FormTextInput
            ref={confirmRef}
            style={[formStyles.input, mismatch && formStyles.inputError]}
            value={confirmPassword}
            onChangeText={(text) => onChange('confirmPassword', text)}
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
