import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Text, StyleSheet } from 'react-native';
import { SafeTouchable } from '../SafeTouchable';

const buttonStyle = { padding: 4 };

const findTouchable = (node) => {
  let current = node;
  while (current && current.props.onPress === undefined) {
    current = current.parent;
  }
  return current;
};

describe('SafeTouchable', () => {
  it('deve travar o botão enquanto a ação assíncrona estiver em andamento', async () => {
    let finish;
    const onPress = jest.fn(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const { getByText } = render(
      <SafeTouchable onPress={onPress} style={buttonStyle}>
        <Text>Salvar</Text>
      </SafeTouchable>
    );

    await act(async () => {
      fireEvent.press(getByText('Salvar'));
    });
    // Toques repetidos durante o carregamento são ignorados
    await act(async () => {
      findTouchable(getByText('Salvar')).props.onPress();
      fireEvent.press(getByText('Salvar'));
    });
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(
      StyleSheet.flatten(findTouchable(getByText('Salvar')).props.style)
    ).toEqual({ padding: 4, opacity: 0.6 });

    await act(async () => {
      finish();
    });
    fireEvent.press(getByText('Salvar'));
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('deve liberar o botão mesmo quando a ação falhar', async () => {
    const onPress = jest
      .fn()
      .mockRejectedValueOnce(new Error('falha'))
      .mockResolvedValueOnce();
    const { getByText } = render(
      <SafeTouchable onPress={onPress}>
        <Text>Enviar</Text>
      </SafeTouchable>
    );

    await act(async () => {
      await expect(
        findTouchable(getByText('Enviar')).props.onPress()
      ).rejects.toThrow('falha');
    });
    await act(async () => {
      fireEvent.press(getByText('Enviar'));
    });
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('não deve travar ações síncronas nem quebrar sem onPress', () => {
    const onPress = jest.fn();
    const { getByText, rerender } = render(
      <SafeTouchable onPress={onPress}>
        <Text>Abrir</Text>
      </SafeTouchable>
    );

    fireEvent.press(getByText('Abrir'));
    fireEvent.press(getByText('Abrir'));
    expect(onPress).toHaveBeenCalledTimes(2);

    rerender(
      <SafeTouchable>
        <Text>Abrir</Text>
      </SafeTouchable>
    );
    expect(() => fireEvent.press(getByText('Abrir'))).not.toThrow();
  });

  it('não deve atualizar o estado depois de desmontado', async () => {
    let finish;
    const onPress = () =>
      new Promise((resolve) => {
        finish = resolve;
      });
    const { getByText, unmount } = render(
      <SafeTouchable onPress={onPress}>
        <Text>Sair</Text>
      </SafeTouchable>
    );

    await act(async () => {
      fireEvent.press(getByText('Sair'));
    });
    unmount();
    await act(async () => {
      finish();
    });
  });
});
