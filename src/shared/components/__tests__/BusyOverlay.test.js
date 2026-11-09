import React from 'react';
import { Text } from 'react-native';
import { render, act } from '@testing-library/react-native';
import { BusyProvider, useBusy } from '../BusyOverlay';

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

function renderWithBusy() {
  const captured = {};
  function Probe() {
    captured.track = useBusy();
    return <Text>tela</Text>;
  }
  const utils = render(
    <BusyProvider>
      <Probe />
    </BusyProvider>
  );
  return { ...utils, captured };
}

describe('BusyOverlay', () => {
  it('deve cobrir a tela enquanto a ação roda e liberar ao terminar', async () => {
    const { captured, queryByTestId, getByText } = renderWithBusy();
    expect(getByText('tela')).toBeTruthy();
    expect(queryByTestId('busy-overlay')).toBeNull();

    const action = deferred();
    let result;
    act(() => {
      result = captured.track(action.promise);
    });
    expect(queryByTestId('busy-overlay')).toBeTruthy();

    await act(async () => {
      action.resolve('ok');
      await expect(result).resolves.toBe('ok');
    });
    expect(queryByTestId('busy-overlay')).toBeNull();
  });

  it('deve esperar todas as ações e liberar mesmo quando uma falhar', async () => {
    const { captured, queryByTestId } = renderWithBusy();
    const first = deferred();
    const second = deferred();
    let failed;

    act(() => {
      failed = captured.track(first.promise);
      captured.track(second.promise);
    });

    await act(async () => {
      first.reject(new Error('falhou'));
      await expect(failed).rejects.toThrow('falhou');
    });
    expect(queryByTestId('busy-overlay')).toBeTruthy();

    await act(async () => second.resolve());
    expect(queryByTestId('busy-overlay')).toBeNull();
  });

  it('não deve fechar pelo voltar do Android', () => {
    const { captured, UNSAFE_getByProps, queryByTestId } = renderWithBusy();
    act(() => {
      captured.track(new Promise(() => {}));
    });

    act(() =>
      UNSAFE_getByProps({ statusBarTranslucent: true }).props.onRequestClose()
    );
    expect(queryByTestId('busy-overlay')).toBeTruthy();
  });

  it('sem o provedor, deve só devolver a ação', async () => {
    const captured = {};
    function Probe() {
      captured.track = useBusy();
      return null;
    }
    render(<Probe />);

    await expect(captured.track(Promise.resolve(3))).resolves.toBe(3);
  });
});
