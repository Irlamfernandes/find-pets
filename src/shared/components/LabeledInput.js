import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';
import { FormTextInput } from './FormScrollView';
import { formStyles } from '../theme/formStyles';
import { palette } from '../theme/colors';

// Campo de formulário com rótulo. `onSubmit` avança para o próximo campo
// sem fechar o teclado; sem ele, o teclado mostra "concluir".
export function LabeledInput({ label, style, onSubmit, ...inputProps }) {
  const submitProps = onSubmit
    ? {
        returnKeyType: 'next',
        submitBehavior: 'submit',
        onSubmitEditing: onSubmit,
      }
    : {};

  return (
    <>
      <Text style={formStyles.label}>{label}</Text>
      <FormTextInput
        style={[formStyles.input, style]}
        selectionColor={palette.primary}
        {...submitProps}
        {...inputProps}
      />
    </>
  );
}

LabeledInput.propTypes = {
  label: PropTypes.string.isRequired,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  onSubmit: PropTypes.func,
};
