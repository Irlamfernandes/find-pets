import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LostPetsMap } from '../LostPetsMap';

describe('LostPetsMap', () => {
  const posts = [
    { id: '1', latitude: -22, longitude: -44, petName: 'Rex' },
    { id: '2', latitude: -23, longitude: -43 },
  ];

  const renderMap = (props = {}) => {
    const callbacks = { onSelect: jest.fn(), onClear: jest.fn() };
    const screen = render(
      <LostPetsMap posts={posts} selectedId={null} {...callbacks} {...props} />
    );
    return { ...screen, ...callbacks };
  };

  it('deve enquadrar todos os pets e mostrar um marcador para cada um', () => {
    const { getByTestId } = renderMap();

    const map = getByTestId('lost-pets-map');
    expect(map.props.initialRegion.latitude).toBeCloseTo(-22.5);
    expect(getByTestId('map-marker-2').props.coordinate).toEqual({
      latitude: -23,
      longitude: -43,
    });
  });

  it('deve avisar o marcador tocado e o toque fora dos marcadores', () => {
    const { getByTestId, onSelect, onClear } = renderMap();

    fireEvent.press(getByTestId('map-marker-2'));
    // O toque no marcador também chega ao mapa, mas não limpa a seleção
    fireEvent(getByTestId('lost-pets-map'), 'press', {
      nativeEvent: { action: 'marker-press' },
    });
    expect(onSelect).toHaveBeenCalledWith('2');
    expect(onClear).not.toHaveBeenCalled();

    fireEvent(getByTestId('lost-pets-map'), 'press', {
      nativeEvent: { action: 'press' },
    });
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('deve destacar o marcador do pet selecionado', () => {
    const { getByTestId } = renderMap({ selectedId: '1' });

    expect(getByTestId('map-marker-1').props.pinColor).toBe('#991B1B');
    expect(getByTestId('map-marker-2').props.pinColor).not.toBe('#991B1B');
  });

  it('deve mostrar aviso quando não houver pets com localização', () => {
    const { getByText, queryByTestId } = renderMap({ posts: [] });

    expect(
      getByText('Nenhum pet perdido com localização registrada.')
    ).toBeTruthy();
    expect(queryByTestId('lost-pets-map')).toBeNull();
  });
});
