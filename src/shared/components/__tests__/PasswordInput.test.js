import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PasswordInput } from '../PasswordInput';

describe('PasswordInput', () => {
  it('deve esconder a senha e mostrar ao tocar no olho', () => {
    const { getByTestId, getByLabelText } = render(
      <PasswordInput testID="campo" value="segredo" onChangeText={jest.fn()} />
    );

    expect(getByTestId('campo').props.secureTextEntry).toBe(true);
    fireEvent.press(getByLabelText('Mostrar senha'));
    expect(getByTestId('campo').props.secureTextEntry).toBe(false);
    fireEvent.press(getByLabelText('Ocultar senha'));
    expect(getByTestId('campo').props.secureTextEntry).toBe(true);
  });

  it('deve seguir a visibilidade controlada por quem usa o campo', () => {
    const onToggle = jest.fn();
    const { getByTestId } = render(
      <PasswordInput
        testID="campo"
        isVisible
        onToggleVisibility={onToggle}
        toggleTestID="olho"
      />
    );

    expect(getByTestId('campo').props.secureTextEntry).toBe(false);
    fireEvent.press(getByTestId('olho'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
