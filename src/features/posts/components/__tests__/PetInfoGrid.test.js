import React from 'react';
import { render } from '@testing-library/react-native';
import { PetInfoGrid } from '../PetInfoGrid';

describe('PetInfoGrid', () => {
  it('deve mostrar cada dado com seu rótulo', () => {
    const { getByText } = render(
      <PetInfoGrid
        fields={[
          { label: 'Nome', value: 'Rex' },
          { label: 'Raça', value: 'Vira-lata' },
        ]}
      />
    );

    expect(getByText('Nome')).toBeTruthy();
    expect(getByText('Rex')).toBeTruthy();
    expect(getByText('Raça')).toBeTruthy();
    expect(getByText('Vira-lata')).toBeTruthy();
  });

  it('não deve renderizar nada sem dados', () => {
    const { queryByTestId } = render(<PetInfoGrid fields={[]} />);

    expect(queryByTestId('pet-info-grid')).toBeNull();
  });
});
