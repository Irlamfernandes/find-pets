import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PasswordInput } from '../PasswordInput';

describe('PasswordInput', () => {
  it('deve esconder a senha e mostrar ao tocar no olho', async () => {
    const { getByTestId, getByLabelText } = await render(
      <PasswordInput testID="campo" value="segredo" onChangeText={jest.fn()} />
    );

    expect(getByTestId('campo').props.secureTextEntry).toBe(true);
    await fireEvent.press(getByLabelText('Mostrar senha'));
    expect(getByTestId('campo').props.secureTextEntry).toBe(false);
    await fireEvent.press(getByLabelText('Ocultar senha'));
    expect(getByTestId('campo').props.secureTextEntry).toBe(true);
  });

  it('deve seguir a visibilidade controlada por quem usa o campo', async () => {
    const onToggle = jest.fn();
    const { getByTestId } = await render(
      <PasswordInput
        testID="campo"
        isVisible
        onToggleVisibility={onToggle}
        toggleTestID="olho"
      />
    );

    expect(getByTestId('campo').props.secureTextEntry).toBe(false);
    await fireEvent.press(getByTestId('olho'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
