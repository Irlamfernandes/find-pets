import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FeedFilters, FilterEmptyState } from '../FeedFilters';

describe('FeedFilters', () => {
  it('deve mostrar a busca e as espécies e avisar as mudanças', async () => {
    const onChangeSpecies = jest.fn();
    const onChangeText = jest.fn();
    const { getByTestId, getByText } = await render(
      <FeedFilters
        species="Todos"
        text=""
        onChangeSpecies={onChangeSpecies}
        onChangeText={onChangeText}
      />
    );

    for (const option of ['Todos', 'Cachorro', 'Gato', 'Outro']) {
      expect(getByText(option)).toBeTruthy();
    }
    await fireEvent.press(getByText('Gato'));
    expect(onChangeSpecies).toHaveBeenCalledWith('Gato');

    await fireEvent.changeText(getByTestId('input-feed-search'), 'rex');
    expect(onChangeText).toHaveBeenCalledWith('rex');
  });

  it('deve oferecer limpar os filtros quando nada combinar', async () => {
    const onClear = jest.fn();
    const { getByText, getByTestId } = await render(
      <FilterEmptyState onClear={onClear} />
    );

    expect(getByText('Nenhum pet encontrado com esses filtros.')).toBeTruthy();
    await fireEvent.press(getByTestId('button-clear-filters'));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
