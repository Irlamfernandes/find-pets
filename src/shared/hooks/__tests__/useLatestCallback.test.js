import { renderHook } from '@testing-library/react-native';
import { useLatestCallback } from '../useLatestCallback';

describe('useLatestCallback', () => {
  it('deve manter a mesma função e chamar sempre a versão mais recente', () => {
    const first = jest.fn(() => 'primeira');
    const second = jest.fn(() => 'segunda');
    const { result, rerender } = renderHook(
      ({ callback }) => useLatestCallback(callback),
      { initialProps: { callback: first } }
    );
    const stable = result.current;

    rerender({ callback: second });

    expect(result.current).toBe(stable);
    expect(result.current('valor')).toBe('segunda');
    expect(second).toHaveBeenCalledWith('valor');
    expect(first).not.toHaveBeenCalled();
  });

  it('deve ignorar a chamada quando não houver função', () => {
    const { result } = renderHook(() => useLatestCallback(undefined));
    expect(result.current()).toBeUndefined();
  });
});
