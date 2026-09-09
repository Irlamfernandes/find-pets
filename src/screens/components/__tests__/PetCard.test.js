import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PetCard } from '../PetCard';

describe('PetCard Component', () => {
  const mockItem = {
    id: '1',
    imageUri: 'https://example.com/pet.jpg',
    type: 'Perdido',
    date: '10/06/2026',
    latitude: -23.5505,
    longitude: -46.6333,
    location: 'São Paulo, SP',
    contactPhone: '5511999999999',
  };

  const mockOnOpenMap = jest.fn();
  const mockOnOpenWhatsApp = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar corretamente as informações do pet', () => {
    const { getByText, getByTestId } = render(
      <PetCard
        item={mockItem}
        onOpenMap={mockOnOpenMap}
        onOpenWhatsApp={mockOnOpenWhatsApp}
      />
    );

    expect(getByText('Perdido')).toBeTruthy();
    expect(getByText('Registrado em: 10/06/2026')).toBeTruthy();

    const image = getByTestId('pet-image');
    expect(image.props.source).toEqual({ uri: mockItem.imageUri });
  });

  it('deve chamar onOpenMap com os parâmetros corretos ao clicar no botão de mapa', () => {
    const { getByText } = render(
      <PetCard
        item={mockItem}
        onOpenMap={mockOnOpenMap}
        onOpenWhatsApp={mockOnOpenWhatsApp}
      />
    );

    fireEvent.press(getByText('📍 Ver no Mapa'));
    expect(mockOnOpenMap).toHaveBeenCalledWith(
      mockItem.latitude,
      mockItem.longitude,
      mockItem.location
    );
  });

  it('deve chamar onOpenWhatsApp com o telefone correto ao clicar no botão do WhatsApp', () => {
    const { getByText } = render(
      <PetCard
        item={mockItem}
        onOpenMap={mockOnOpenMap}
        onOpenWhatsApp={mockOnOpenWhatsApp}
      />
    );

    fireEvent.press(getByText('💬 WhatsApp'));
    expect(mockOnOpenWhatsApp).toHaveBeenCalledWith(mockItem.contactPhone);
  });
});
