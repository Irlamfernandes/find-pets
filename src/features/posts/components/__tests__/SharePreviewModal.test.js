import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { SharePreviewModal } from '../SharePreviewModal';

describe('SharePreviewModal', () => {
  const post = {
    images: ['file:///docs/post-photo-1.jpg'],
    petName: 'Rex',
    species: 'Cachorro',
    status: 'Perdido',
  };

  it('deve liberar o compartilhamento só depois de a foto carregar', async () => {
    const onShare = jest.fn().mockResolvedValue(undefined);
    const { getByTestId, getByText, queryByText } = render(
      <SharePreviewModal post={post} onShare={onShare} onClose={jest.fn()} />
    );

    expect(getByText('Compartilhar cartaz')).toBeTruthy();
    expect(queryByText('Compartilhar')).toBeNull();
    fireEvent.press(getByTestId('button-share-poster'));
    expect(onShare).not.toHaveBeenCalled();

    fireEvent(getByTestId('share-poster-image'), 'loadEnd');
    await act(async () => {
      fireEvent.press(getByText('Compartilhar'));
    });

    expect(onShare).toHaveBeenCalledTimes(1);
    // Recebe a referência do cartaz para gerar a imagem
    expect(onShare.mock.calls[0][0]).toBeTruthy();
  });

  it('deve fechar pelo cancelar e reiniciar o carregamento', () => {
    const onClose = jest.fn();
    const { getByText, getByTestId, queryByText } = render(
      <SharePreviewModal post={post} onShare={jest.fn()} onClose={onClose} />
    );

    fireEvent(getByTestId('share-poster-image'), 'loadEnd');
    expect(getByText('Compartilhar')).toBeTruthy();

    fireEvent.press(getByText('Cancelar'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(queryByText('Compartilhar')).toBeNull();
  });

  it('não deve mostrar o cartaz sem registro', () => {
    const { queryByTestId } = render(
      <SharePreviewModal post={null} onShare={jest.fn()} onClose={jest.fn()} />
    );

    expect(queryByTestId('share-poster')).toBeNull();
  });
});
