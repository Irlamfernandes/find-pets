import { renderHook, act } from '@testing-library/react-native';
import { Keyboard } from 'react-native';
import { useKeyboardVisible } from '../useKeyboardVisible';

describe('useKeyboardVisible', () => {
  it('deve acompanhar a abertura e o fechamento do teclado', async () => {
    const listeners = {};
    const remove = jest.fn();
    jest.spyOn(Keyboard, 'addListener').mockImplementation((event, cb) => {
      listeners[event] = cb;
      return { remove };
    });

    const { result, unmount } = await renderHook(() => useKeyboardVisible());
    expect(result.current).toBe(false);

    await act(() => listeners.keyboardDidShow());
    expect(result.current).toBe(true);

    await act(() => listeners.keyboardDidHide());
    expect(result.current).toBe(false);

    await unmount();
    expect(remove).toHaveBeenCalledTimes(2);
    Keyboard.addListener.mockRestore();
  });
});
