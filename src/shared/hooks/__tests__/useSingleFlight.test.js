import { renderHook, act } from '@testing-library/react-native';
import { useSingleFlight } from '../useSingleFlight';

describe('useSingleFlight', () => {
  it('deve reaproveitar a execução em andamento e liberar ao terminar', async () => {
    let finish;
    const action = jest.fn(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const { result } = renderHook(() => useSingleFlight(action));

    const first = result.current('a');
    const second = result.current('b');
    expect(action).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledWith('a');
    expect(second).toBe(first);

    await act(async () => {
      finish('ok');
      await first;
    });

    result.current('c');
    expect(action).toHaveBeenCalledTimes(2);
  });

  it('deve liberar após falha e repassar resultados síncronos', async () => {
    const failing = jest.fn().mockRejectedValueOnce(new Error('x'));
    const { result } = renderHook(() => useSingleFlight(failing));

    await act(async () => {
      await expect(result.current()).rejects.toThrow('x');
    });
    failing.mockResolvedValueOnce('de novo');
    await act(async () => {
      await expect(result.current()).resolves.toBe('de novo');
    });

    const sync = renderHook(() => useSingleFlight(() => 42));
    expect(sync.result.current()).toBe(42);
    expect(sync.result.current()).toBe(42);
  });
});
