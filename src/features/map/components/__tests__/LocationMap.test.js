import React from 'react';
import { render } from '@testing-library/react-native';
import { LocationMap } from '../LocationMap';

describe('LocationMap', () => {
  it('deve mostrar o ponto num mapa estático e leve no card', () => {
    const { getByTestId } = render(
      <LocationMap latitude={-23.5} longitude={-46.6} />
    );

    const map = getByTestId('location-map');
    expect(map.props.initialRegion).toEqual({
      latitude: -23.5,
      longitude: -46.6,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
    expect(map.props).toMatchObject({
      liteMode: true,
      scrollEnabled: false,
      zoomEnabled: false,
    });
    expect(map.props.children.props.coordinate).toEqual({
      latitude: -23.5,
      longitude: -46.6,
    });
  });

  it('deve permitir mover e aproximar o mapa em tela cheia', () => {
    const { getByTestId } = render(
      <LocationMap latitude={-23.5} longitude={-46.6} interactive />
    );

    expect(getByTestId('location-map').props).toMatchObject({
      liteMode: false,
      scrollEnabled: true,
      zoomEnabled: true,
    });
  });

  it('deve exibir aviso quando não houver coordenadas', () => {
    const { getByText, queryByTestId } = render(
      <LocationMap latitude={null} longitude={undefined} />
    );

    expect(getByText('Localização não disponível')).toBeTruthy();
    expect(queryByTestId('location-map')).toBeNull();
  });
});
