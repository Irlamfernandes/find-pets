import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BreedSuggestions } from '../BreedSuggestions';

describe('BreedSuggestions', () => {
  it('não deve aparecer sem sugestões', () => {
    const { queryByTestId } = render(
      <BreedSuggestions suggestions={[]} onSelect={jest.fn()} />
    );

    expect(queryByTestId('breed-suggestions')).toBeNull();
  });

  it('deve mostrar as raças e devolver a escolhida', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <BreedSuggestions suggestions={['Pug', 'Puli']} onSelect={onSelect} />
    );

    expect(getByText('Sugestões de raça')).toBeTruthy();
    fireEvent.press(getByText('Puli'));
    expect(onSelect).toHaveBeenCalledWith('Puli');
  });
});
