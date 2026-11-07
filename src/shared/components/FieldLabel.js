import React from 'react';
import { Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { formStyles } from '../theme/formStyles';
import { palette } from '../theme/colors';

export function FieldLabel({ children, required = false, style }) {
  return (
    <Text style={[formStyles.label, style]}>
      {children}
      {required ? (
        <Text testID="required-mark" style={styles.required}>
          {' *'}
        </Text>
      ) : null}
    </Text>
  );
}

FieldLabel.propTypes = {
  children: PropTypes.node.isRequired,
  required: PropTypes.bool,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

const styles = StyleSheet.create({
  required: { color: palette.error },
});
