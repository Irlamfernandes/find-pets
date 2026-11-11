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
    const { getByTestId, getByText, queryByText } = await render(
      <SharePreviewModal post={post} onShare={onShare} onClose={jest.fn()} />
    );

    expect(getByText('Compartilhar cartaz')).toBeTruthy();
    expect(queryByText('Compartilhar')).toBeNull();
    await fireEvent.press(getByTestId('button-share-poster'));
    expect(onShare).not.toHaveBeenCalled();

    await fireEvent(getByTestId('share-poster-image'), 'loadEnd');
    await act(async () => {
      await fireEvent.press(getByText('Compartilhar'));
    });

    expect(onShare).toHaveBeenCalledTimes(1);
    expect(onShare.mock.calls[0][0]).toBeTruthy();
  });

  it('deve fechar pelo cancelar e reiniciar o carregamento', async () => {
    const onClose = jest.fn();
    const { getByText, getByTestId, queryByText } = await render(
      <SharePreviewModal post={post} onShare={jest.fn()} onClose={onClose} />
    );

    await fireEvent(getByTestId('share-poster-image'), 'loadEnd');
    expect(getByText('Compartilhar')).toBeTruthy();

    await fireEvent.press(getByText('Cancelar'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(queryByText('Compartilhar')).toBeNull();
  });

  it('não deve mostrar o cartaz sem registro', async () => {
    const { queryByTestId } = await render(
      <SharePreviewModal post={null} onShare={jest.fn()} onClose={jest.fn()} />
    );

    expect(queryByTestId('share-poster')).toBeNull();
  });
});
