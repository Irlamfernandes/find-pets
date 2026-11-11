import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { PhotoViewerModal } from '../PhotoViewerModal';

describe('PhotoViewerModal', () => {
  const images = ['a.jpg', 'b.jpg', 'c.jpg'];

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(async () => {
    await act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('deve exibir as fotos em tela cheia a partir da foto escolhida', async () => {
    const { getAllByTestId, getByText, getByTestId } = await render(
      <PhotoViewerModal images={images} initialIndex={1} onClose={jest.fn()} />
    );

    expect(getByTestId('photo-viewer')).toBeTruthy();
    const sources = getAllByTestId('photo-viewer-image').map(
      (image) => image.props.source.uri
    );
    expect(sources).toContain('b.jpg');
    expect(getByText('2 de 3')).toBeTruthy();
  });

  it('deve atualizar o contador ao deslizar, reiniciar ao abrir e fechar', async () => {
    const onClose = jest.fn();
    const { getByText, getByTestId } = await render(
      <PhotoViewerModal images={images} initialIndex={0} onClose={onClose} />
    );

    await fireEvent(getByTestId('photo-viewer-list'), 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: 1500 } },
    });
    expect(getByText('3 de 3')).toBeTruthy();

    await fireEvent(getByTestId('photo-viewer'), 'show');
    expect(getByText('1 de 3')).toBeTruthy();

    await fireEvent.press(getByTestId('button-close-photo-viewer'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('deve ficar oculto quando não houver fotos', async () => {
    const { queryByTestId } = await render(
      <PhotoViewerModal images={[]} onClose={jest.fn()} />
    );

    expect(queryByTestId('photo-viewer')).toBeNull();
  });
});
