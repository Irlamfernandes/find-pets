import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Modal } from 'react-native';
import { PhotoViewerModal } from '../PhotoViewerModal';

describe('PhotoViewerModal', () => {
  const images = ['a.jpg', 'b.jpg', 'c.jpg'];

  it('deve exibir as fotos em tela cheia a partir da foto escolhida', () => {
    const { getAllByTestId, getByText, UNSAFE_getByType } = render(
      <PhotoViewerModal images={images} initialIndex={1} onClose={jest.fn()} />
    );

    expect(UNSAFE_getByType(Modal).props.visible).toBe(true);
    const sources = getAllByTestId('photo-viewer-image').map(
      (image) => image.props.source.uri
    );
    expect(sources).toContain('b.jpg');
    expect(getByText('2 de 3')).toBeTruthy();
  });

  it('deve atualizar o contador ao deslizar, reiniciar ao abrir e fechar', () => {
    const onClose = jest.fn();
    const { getByText, getByTestId, UNSAFE_getByType, UNSAFE_getByProps } =
      render(
        <PhotoViewerModal images={images} initialIndex={0} onClose={onClose} />
      );

    const list = UNSAFE_getByProps({ pagingEnabled: true });
    expect(list.props.getItemLayout(null, 2)).toEqual({
      length: 750,
      offset: 1500,
      index: 2,
    });

    fireEvent(list, 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: 1500 } },
    });
    expect(getByText('3 de 3')).toBeTruthy();

    fireEvent(UNSAFE_getByType(Modal), 'show');
    expect(getByText('1 de 3')).toBeTruthy();

    fireEvent.press(getByTestId('button-close-photo-viewer'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('deve ficar oculto quando não houver fotos', () => {
    const { UNSAFE_getByType } = render(
      <PhotoViewerModal images={[]} onClose={jest.fn()} />
    );

    expect(UNSAFE_getByType(Modal).props.visible).toBe(false);
  });
});
