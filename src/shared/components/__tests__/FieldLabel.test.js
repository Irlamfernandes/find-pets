import React from 'react';
import { render } from '@testing-library/react-native';
import { FieldLabel } from '../FieldLabel';
import { palette } from '../../theme/colors';

describe('FieldLabel', () => {
  it('deve marcar o campo obrigatório com um asterisco vermelho', () => {
    const { getByText, getByTestId } = render(
      <FieldLabel required>Nome</FieldLabel>
    );

    expect(getByText('Nome *')).toBeTruthy();
    expect(getByTestId('required-mark')).toHaveStyle({ color: palette.error });
  });

  it('não deve marcar o campo opcional', () => {
    const { getByText, queryByTestId } = render(
      <FieldLabel>Raça (opcional)</FieldLabel>
    );

    expect(getByText('Raça (opcional)')).toBeTruthy();
    expect(queryByTestId('required-mark')).toBeNull();
  });
});
