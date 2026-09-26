import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MapPetSummary } from '../MapPetSummary';

describe('MapPetSummary', () => {
  const post = {
    id: '1',
    images: ['file:///docs/post-photo-1.jpg'],
    petName: 'Rex',
    species: 'Cachorro',
    size: 'Médio',
    occurredAt: new Date(2026, 8, 25, 14, 30).toISOString(),
    location: 'Av. Paulista, 1000',
    latitude: -23.56,
    longitude: -46.65,
    contactPhone: '5511999999999',
  };

  const handlers = {
    onClose: jest.fn(),
    onOpenPhoto: jest.fn(),
    onOpenWhatsApp: jest.fn(),
    onOpenRoute: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve mostrar o resumo do pet com os dados identificados', () => {
    const { getByText, queryByText } = render(
      <MapPetSummary post={post} {...handlers} />
    );

    expect(getByText('Rex')).toBeTruthy();
    expect(getByText('25/09/2026 às 14:30 (BRT, UTC-3)')).toBeTruthy();
    expect(getByText('Av. Paulista, 1000')).toBeTruthy();
    expect(getByText('Espécie')).toBeTruthy();
    expect(getByText('Cachorro')).toBeTruthy();
    // O nome não se repete na grade
    expect(queryByText('Nome')).toBeNull();
  });

  it('deve disparar as ações do resumo', () => {
    const { getByText, getByLabelText } = render(
      <MapPetSummary post={post} {...handlers} />
    );

    fireEvent.press(getByLabelText('Ver foto em tela cheia'));
    fireEvent.press(getByText('WhatsApp'));
    fireEvent.press(getByText('Como chegar'));
    fireEvent.press(getByLabelText('Fechar resumo'));

    expect(handlers.onOpenPhoto).toHaveBeenCalledTimes(1);
    expect(handlers.onOpenWhatsApp).toHaveBeenCalledWith('5511999999999');
    expect(handlers.onOpenRoute).toHaveBeenCalledTimes(1);
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
  });

  it('deve funcionar com registros antigos', () => {
    const { getByText, queryByText } = render(
      <MapPetSummary
        post={{ id: '2', imageUri: 'x.jpg', type: 'Perdido', date: '10/06' }}
        {...handlers}
      />
    );

    expect(getByText('Pet perdido')).toBeTruthy();
    expect(getByText('10/06')).toBeTruthy();
    expect(queryByText('Espécie')).toBeNull();
  });
});
