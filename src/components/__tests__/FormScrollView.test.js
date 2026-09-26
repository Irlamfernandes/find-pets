import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Keyboard, ScrollView, TextInput } from 'react-native';
import { FormScrollView, FormTextInput } from '../FormScrollView';

describe('FormScrollView', () => {
  let listeners;
  let removeMocks;
  let scrollToSpy;

  const emit = (event, payload) => act(() => listeners[event](payload));

  const mockFocusedInput = (y, height = 40) => {
    jest.spyOn(TextInput.State, 'currentlyFocusedInput').mockReturnValue({
      measureInWindow: (callback) => callback(0, y, 200, height),
    });
  };

  beforeEach(() => {
    jest.useFakeTimers();
    listeners = {};
    removeMocks = [];
    jest.spyOn(Keyboard, 'addListener').mockImplementation((event, cb) => {
      listeners[event] = cb;
      const remove = jest.fn();
      removeMocks.push(remove);
      return { remove };
    });
    scrollToSpy = jest
      .spyOn(ScrollView.prototype, 'scrollTo')
      .mockImplementation(() => {});
    scrollToSpy.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const renderForm = (props = {}) =>
    render(
      <FormScrollView {...props}>
        <FormTextInput testID="field" placeholder="Campo" />
      </FormScrollView>
    );

  it('deve reservar espaço e rolar até o campo coberto pelo teclado', () => {
    const { getByTestId, getByPlaceholderText } = renderForm();
    mockFocusedInput(700);

    fireEvent.scroll(getByTestId('field').parent.parent, {
      nativeEvent: { contentOffset: { y: 50 } },
    });
    emit('keyboardDidShow', { endCoordinates: { screenY: 600, height: 300 } });

    expect(getByTestId('keyboard-spacer').props.style).toEqual({
      height: 300,
    });
    act(() => jest.runAllTimers());

    // 700 + 40 + 24 (margem) - 600 = 164 de sobreposição
    expect(scrollToSpy).toHaveBeenCalledWith({ y: 214, animated: true });
    expect(getByPlaceholderText('Campo')).toBeTruthy();
  });

  it('não deve rolar quando o campo já estiver visível ou não houver foco', () => {
    renderForm({ bottomOffset: 0 });

    mockFocusedInput(100);
    emit('keyboardDidShow', { endCoordinates: { screenY: 600, height: 300 } });
    act(() => jest.runAllTimers());

    TextInput.State.currentlyFocusedInput.mockReturnValue(null);
    emit('keyboardDidShow', { endCoordinates: { screenY: 600, height: 300 } });
    act(() => jest.runAllTimers());

    expect(scrollToSpy).not.toHaveBeenCalled();
  });

  it('deve rolar ao focar outro campo com o teclado aberto e ignorar sem teclado', () => {
    const onFocus = jest.fn();
    const { getByTestId } = render(
      <FormScrollView>
        <FormTextInput testID="field" onFocus={onFocus} />
      </FormScrollView>
    );
    mockFocusedInput(800);

    // Sem teclado aberto, o foco não rola (o evento do teclado cuidará disso)
    fireEvent(getByTestId('field'), 'focus', { nativeEvent: {} });
    act(() => jest.runAllTimers());
    expect(scrollToSpy).not.toHaveBeenCalled();
    expect(onFocus).toHaveBeenCalledTimes(1);

    emit('keyboardDidShow', { endCoordinates: { screenY: 600, height: 300 } });
    act(() => jest.runAllTimers());
    scrollToSpy.mockClear();

    fireEvent(getByTestId('field'), 'focus', { nativeEvent: {} });
    act(() => jest.runAllTimers());
    expect(scrollToSpy).toHaveBeenCalledTimes(1);
  });

  it('deve remover o espaço ao fechar o teclado e os ouvintes ao desmontar', () => {
    const { getByTestId, unmount } = renderForm();

    emit('keyboardDidShow', { endCoordinates: { screenY: 600, height: 300 } });
    emit('keyboardDidHide');
    expect(getByTestId('keyboard-spacer').props.style).toEqual({ height: 0 });

    unmount();
    removeMocks.forEach((remove) => expect(remove).toHaveBeenCalled());
  });

  it('FormTextInput deve funcionar fora de um FormScrollView', () => {
    const { getByTestId } = render(<FormTextInput testID="solo" />);

    expect(() =>
      fireEvent(getByTestId('solo'), 'focus', { nativeEvent: {} })
    ).not.toThrow();
  });
});
