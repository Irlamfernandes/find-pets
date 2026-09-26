import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LabeledInput } from '../LabeledInput';

describe('LabeledInput', () => {
  it('deve mostrar o rótulo e avançar ao próximo campo', () => {
    const onSubmit = jest.fn();
    const { getByText, getByTestId } = render(
      <LabeledInput label="Nome" testID="campo" onSubmit={onSubmit} />
    );

    expect(getByText('Nome')).toBeTruthy();
    const input = getByTestId('campo');
    expect(input.props.returnKeyType).toBe('next');
    fireEvent(input, 'submitEditing');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('deve permitir sobrescrever o comportamento do teclado', () => {
    const { getByTestId } = render(
      <LabeledInput label="Notas" testID="campo" returnKeyType="done" />
    );
    expect(getByTestId('campo').props.returnKeyType).toBe('done');
    expect(getByTestId('campo').props.onSubmitEditing).toBeUndefined();
  });
});
