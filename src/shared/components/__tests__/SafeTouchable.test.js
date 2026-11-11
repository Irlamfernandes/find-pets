import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Text, StyleSheet } from 'react-native';
import { SafeTouchable } from '../SafeTouchable';

const buttonStyle = { padding: 4 };

const tap = (element) =>
  act(async () => {
    element.props.onClick({ nativeEvent: {} });
  });

const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

describe('SafeTouchable', () => {
  it('deve travar o botão enquanto a ação assíncrona estiver em andamento', async () => {
    const action = deferred();
    const onPress = jest.fn(() => action.promise);
    const { getByTestId } = await render(
      <SafeTouchable testID="botao" onPress={onPress} style={buttonStyle}>
        <Text>Salvar</Text>
      </SafeTouchable>
    );

    await act(async () => {
      getByTestId('botao').props.onClick({ nativeEvent: {} });
      getByTestId('botao').props.onClick({ nativeEvent: {} });
    });
    expect(getByTestId('botao')).toBeDisabled();
    await tap(getByTestId('botao'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(StyleSheet.flatten(getByTestId('botao').props.style)).toEqual(
      expect.objectContaining({ padding: 4 })
    );

    await act(async () => {
      action.resolve();
    });
    expect(getByTestId('botao')).toBeEnabled();
    await fireEvent.press(getByTestId('botao'));
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('deve liberar o botão mesmo quando a ação falhar', async () => {
    const onPress = jest
      .fn()
      .mockRejectedValueOnce(new Error('falha'))
      .mockResolvedValueOnce();
    const { getByTestId } = await render(
      <SafeTouchable testID="botao" onPress={onPress}>
        <Text>Enviar</Text>
      </SafeTouchable>
    );

    await expect(fireEvent.press(getByTestId('botao'))).rejects.toThrow(
      'falha'
    );
    expect(getByTestId('botao')).toBeEnabled();
    await fireEvent.press(getByTestId('botao'));
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('não deve travar ações síncronas nem quebrar sem onPress', async () => {
    const onPress = jest.fn();
    const { getByTestId, rerender } = await render(
      <SafeTouchable testID="botao" onPress={onPress}>
        <Text>Abrir</Text>
      </SafeTouchable>
    );

    await fireEvent.press(getByTestId('botao'));
    await fireEvent.press(getByTestId('botao'));
    expect(onPress).toHaveBeenCalledTimes(2);

    await rerender(
      <SafeTouchable testID="botao">
        <Text>Abrir</Text>
      </SafeTouchable>
    );
    await expect(fireEvent.press(getByTestId('botao'))).resolves.toBe(
      undefined
    );
  });

  it('não deve atualizar o estado depois de desmontado', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    const action = deferred();
    const { getByTestId, unmount } = await render(
      <SafeTouchable testID="botao" onPress={() => action.promise}>
        <Text>Sair</Text>
      </SafeTouchable>
    );

    await tap(getByTestId('botao'));
    expect(getByTestId('botao')).toBeDisabled();
    await unmount();
    await act(async () => {
      action.resolve();
    });

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
