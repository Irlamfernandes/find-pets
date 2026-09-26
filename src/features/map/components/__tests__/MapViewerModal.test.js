import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MapViewerModal } from '../MapViewerModal';

/* eslint-disable react/prop-types */
jest.mock('../LocationMap', () => ({
  LocationMap: ({ latitude, longitude, interactive }) => {
    const { Text: RNText } = require('react-native');
    return (
      <RNText>{`mapa:${latitude},${longitude}:${String(interactive)}`}</RNText>
    );
  },
}));
/* eslint-enable react/prop-types */

describe('MapViewerModal', () => {
  it('deve exibir o mapa interativo com o endereço e fechar', () => {
    const onClose = jest.fn();
    const { getByText, getByTestId } = render(
      <MapViewerModal
        post={{ latitude: 1, longitude: 2, location: 'Rua A, 10' }}
        onClose={onClose}
      />
    );

    expect(getByText('Local do desaparecimento')).toBeTruthy();
    expect(getByText('Rua A, 10')).toBeTruthy();
    expect(getByText('mapa:1,2:true')).toBeTruthy();

    fireEvent.press(getByTestId('button-close-map-viewer'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('deve omitir o endereço quando não houver', () => {
    const { queryByText, getByText } = render(
      <MapViewerModal
        post={{ latitude: 1, longitude: 2 }}
        onClose={jest.fn()}
      />
    );

    expect(getByText('mapa:1,2:true')).toBeTruthy();
    expect(queryByText('Rua A, 10')).toBeNull();
  });

  it('não deve renderizar o mapa sem post', () => {
    const { queryByText } = render(
      <MapViewerModal post={null} onClose={jest.fn()} />
    );

    expect(queryByText(/mapa:/)).toBeNull();
  });
});
