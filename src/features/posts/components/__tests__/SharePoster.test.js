import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SharePoster } from '../SharePoster';

describe('SharePoster', () => {
  const post = {
    images: ['file:///docs/post-photo-1.jpg'],
    petName: 'Rex',
    species: 'Cachorro',
    size: 'Médio',
    description: 'Coleira azul.',
    occurredAt: new Date(2026, 8, 25, 14, 30).toISOString(),
    location: 'Av. Paulista, 1000',
    contactPhone: '5511999999999',
    status: 'Perdido',
  };

  it('deve montar o cartaz com foto e todas as informações', () => {
    const onImageLoadEnd = jest.fn();
    const { getByText, getByTestId } = render(
      <SharePoster post={post} onImageLoadEnd={onImageLoadEnd} />
    );

    expect(getByText('PROCURA-SE')).toBeTruthy();
    expect(getByTestId('share-poster-image').props.source).toEqual({
      uri: 'file:///docs/post-photo-1.jpg',
    });
    expect(getByText('Rex')).toBeTruthy();
    // O nome é o título; os demais dados vêm com rótulo
    expect(getByText('Espécie')).toBeTruthy();
    expect(getByText('Cachorro')).toBeTruthy();
    expect(getByText('Porte')).toBeTruthy();
    expect(getByText('Médio')).toBeTruthy();
    expect(
      getByText('Desapareceu em 25/09/2026 às 14:30 (BRT, UTC-3)')
    ).toBeTruthy();
    expect(getByText('Av. Paulista, 1000')).toBeTruthy();
    expect(getByText('Coleira azul.')).toBeTruthy();
    expect(getByText('+55 (11) 99999-9999')).toBeTruthy();
    expect(getByText('Compartilhado pelo FindPets')).toBeTruthy();

    fireEvent(getByTestId('share-poster-image'), 'loadEnd');
    expect(onImageLoadEnd).toHaveBeenCalledTimes(1);
  });

  it('deve montar o cartaz de encontrado sem data de desaparecimento nem contato', () => {
    const { getByText, queryByText } = render(
      <SharePoster post={{ ...post, status: 'Encontrado' }} />
    );

    expect(getByText('ENCONTRADO')).toBeTruthy();
    expect(queryByText(/Desapareceu em/)).toBeNull();
    expect(queryByText('+55 (11) 99999-9999')).toBeNull();
  });

  it('deve omitir as informações que o registro não tiver', () => {
    const { getByText, queryByText } = render(
      <SharePoster
        post={{ type: 'Perdido', imageUri: 'file:///a.jpg', date: '' }}
      />
    );

    expect(getByText('Pet')).toBeTruthy();
    expect(queryByText(/Desapareceu em/)).toBeNull();
    expect(queryByText('Porte')).toBeNull();
  });
});
