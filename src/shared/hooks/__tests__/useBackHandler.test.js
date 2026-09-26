import { renderHook } from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import { useBackHandler } from '../useBackHandler';

describe('useBackHandler', () => {
  it('deve executar a ação atual ao voltar e impedir o fechamento do app', () => {
    let backListener;
    const remove = jest.fn();
    jest
      .spyOn(BackHandler, 'addEventListener')
      .mockImplementation((event, cb) => {
        expect(event).toBe('hardwareBackPress');
        backListener = cb;
        return { remove };
      });
    const firstAction = jest.fn();
    const latestAction = jest.fn();

    const { rerender, unmount } = renderHook(
      ({ action }) => useBackHandler(action),
      { initialProps: { action: firstAction } }
    );
    rerender({ action: latestAction });

    expect(backListener()).toBe(true);
    expect(latestAction).toHaveBeenCalledTimes(1);
    expect(firstAction).not.toHaveBeenCalled();
    expect(BackHandler.addEventListener).toHaveBeenCalledTimes(1);

    unmount();
    expect(remove).toHaveBeenCalledTimes(1);
    BackHandler.addEventListener.mockRestore();
  });
});
