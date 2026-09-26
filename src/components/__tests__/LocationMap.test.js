import React from 'react';
import { render } from '@testing-library/react-native';
import { LocationMap, buildMapHtml } from '../LocationMap';

/* eslint-disable react/prop-types */
jest.mock('react-native-webview', () => ({
  WebView: (props) => {
    const { View: RNView } = require('react-native');
    return <RNView testID={props.testID} {...props} />;
  },
}));
/* eslint-enable react/prop-types */

describe('LocationMap', () => {
  it('deve gerar o HTML do Leaflet com o marcador e interação configurada', () => {
    const staticHtml = buildMapHtml(-23.5, -46.6, false);
    expect(staticHtml).toContain('setView([-23.5, -46.6], 16)');
    expect(staticHtml).toContain('L.marker([-23.5, -46.6])');
    expect(staticHtml).toContain('dragging: false');
    expect(staticHtml).toContain('tile.openstreetmap.org');

    expect(buildMapHtml(1, 2, true)).toContain('dragging: true');
  });

  it('deve renderizar o mapa estático dentro do app', () => {
    const { getByTestId } = render(
      <LocationMap latitude={-23.5} longitude={-46.6} />
    );

    const map = getByTestId('location-map');
    expect(map.props.source.html).toContain('dragging: false');
    expect(map.props.source.baseUrl).toBe('https://findpets.app/');
    expect(map.props.applicationNameForUserAgent).toBe('FindPets/1.0');
  });

  it('deve renderizar o mapa interativo', () => {
    const { getByTestId } = render(
      <LocationMap latitude={-23.5} longitude={-46.6} interactive />
    );

    expect(getByTestId('location-map').props.source.html).toContain(
      'dragging: true'
    );
  });

  it('deve exibir aviso quando não houver coordenadas', () => {
    const { getByText, queryByTestId } = render(
      <LocationMap latitude={null} longitude={undefined} />
    );

    expect(getByText('Localização não disponível')).toBeTruthy();
    expect(queryByTestId('location-map')).toBeNull();
  });
});
