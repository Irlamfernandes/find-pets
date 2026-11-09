import React from 'react';
import PropTypes from 'prop-types';
import { FieldLabel } from './FieldLabel';
import { FormTextInput } from './FormScrollView';
import { formStyles } from '../theme/formStyles';
import { palette } from '../theme/colors';

export function LabeledInput({
  label,
  required = false,
  style,
  onSubmit,
  ...inputProps
}) {
  const submitProps = onSubmit
    ? {
        returnKeyType: 'next',
        submitBehavior: 'submit',
        onSubmitEditing: onSubmit,
      }
    : {};

  return (
    <>
      <FieldLabel required={required}>{label}</FieldLabel>
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
  required: PropTypes.bool,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  onSubmit: PropTypes.func,
};
