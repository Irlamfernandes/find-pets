import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BreedSuggestions } from '../BreedSuggestions';

describe('BreedSuggestions', () => {
  it('não deve aparecer sem sugestões', async () => {
    const { queryByTestId } = await render(
      <BreedSuggestions suggestions={[]} onSelect={jest.fn()} />
    );

    expect(queryByTestId('breed-suggestions')).toBeNull();
  });

  it('deve mostrar as raças e devolver a escolhida', async () => {
    const onSelect = jest.fn();
    const { getByText } = await render(
      <BreedSuggestions suggestions={['Pug', 'Puli']} onSelect={onSelect} />
    );

    expect(getByText('Sugestões de raça')).toBeTruthy();
    await fireEvent.press(getByText('Puli'));
    expect(onSelect).toHaveBeenCalledWith('Puli');
  });
});
