import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SafeTouchable } from './SafeTouchable';
import { FormTextInput } from './FormScrollView';
import { palette } from '../theme/colors';

export function VisibilityToggle({ isVisible, onToggle, testID }) {
  return (
    <SafeTouchable
      testID={testID}
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
  testID: PropTypes.string,
};

export function PasswordInput({
  inputRef,
  containerStyle,
  isVisible: controlledVisible,
  onToggleVisibility,
  toggleTestID = 'button-toggle-password-visibility',
  ...inputProps
}) {
  const [ownVisible, setOwnVisible] = useState(false);
  const isControlled = controlledVisible !== undefined;
  const isVisible = isControlled ? controlledVisible : ownVisible;
  const toggle = isControlled
    ? onToggleVisibility
    : () => setOwnVisible((visible) => !visible);

  return (
    <View style={[styles.container, containerStyle]}>
      <FormTextInput
        ref={inputRef}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        selectionColor={palette.primary}
        placeholderTextColor="#888"
        {...inputProps}
        secureTextEntry={!isVisible}
      />
      <VisibilityToggle
        testID={toggleTestID}
        isVisible={isVisible}
        onToggle={toggle}
      />
    </View>
  );
}

PasswordInput.propTypes = {
  inputRef: PropTypes.object,
  containerStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  isVisible: PropTypes.bool,
  onToggleVisibility: PropTypes.func,
  toggleTestID: PropTypes.string,
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 12,
  },
  input: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 12,
    fontSize: 16,
    color: palette.text,
  },
  toggle: { paddingHorizontal: 12, paddingVertical: 10 },
});
