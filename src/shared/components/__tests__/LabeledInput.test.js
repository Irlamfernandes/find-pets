import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LabeledInput } from '../LabeledInput';

describe('LabeledInput', () => {
  it('deve mostrar o rótulo e avançar ao próximo campo', async () => {
    const onSubmit = jest.fn();
    const { getByText, getByTestId } = await render(
      <LabeledInput label="Nome" testID="campo" onSubmit={onSubmit} />
    );

    expect(getByText('Nome')).toBeTruthy();
    const input = getByTestId('campo');
    expect(input.props.returnKeyType).toBe('next');
    await fireEvent(input, 'submitEditing');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('deve permitir sobrescrever o comportamento do teclado', async () => {
    const { getByTestId } = await render(
      <LabeledInput label="Notas" testID="campo" returnKeyType="done" />
    );
    expect(getByTestId('campo').props.returnKeyType).toBe('done');
    expect(getByTestId('campo').props.onSubmitEditing).toBeUndefined();
  });

  it('deve marcar o campo obrigatório', async () => {
    const { getByText, getByTestId } = await render(
      <LabeledInput label="WhatsApp" required testID="campo" />
    );

    expect(getByText('WhatsApp *')).toBeTruthy();
    expect(getByTestId('required-mark')).toBeTruthy();
  });
});
