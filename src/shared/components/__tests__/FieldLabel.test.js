import React from 'react';
import { render } from '@testing-library/react-native';
import { FieldLabel } from '../FieldLabel';
import { palette } from '../../theme/colors';

describe('FieldLabel', () => {
  it('deve marcar o campo obrigatório com um asterisco vermelho', async () => {
    const { getByText, getByTestId } = await render(
      <FieldLabel required>Nome</FieldLabel>
    );

    expect(getByText('Nome *')).toBeTruthy();
    expect(getByTestId('required-mark')).toHaveStyle({ color: palette.error });
  });

  it('não deve marcar o campo opcional', async () => {
    const { getByText, queryByTestId } = await render(
      <FieldLabel>Raça (opcional)</FieldLabel>
    );

    expect(getByText('Raça (opcional)')).toBeTruthy();
    expect(queryByTestId('required-mark')).toBeNull();
  });
});
