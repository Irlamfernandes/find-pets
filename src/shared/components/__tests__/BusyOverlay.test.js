import React from 'react';
import { Text } from 'react-native';
import { render, act, fireEvent } from '@testing-library/react-native';
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

async function renderWithBusy() {
  const captured = {};
  function Probe() {
    captured.track = useBusy();
    return <Text>tela</Text>;
  }
  const utils = await render(
    <BusyProvider>
      <Probe />
    </BusyProvider>
  );
  return { ...utils, captured };
}

describe('BusyOverlay', () => {
  it('deve cobrir a tela enquanto a ação roda e liberar ao terminar', async () => {
    const { captured, queryByTestId, getByText } = await renderWithBusy();
    expect(getByText('tela')).toBeTruthy();
    expect(queryByTestId('busy-overlay')).toBeNull();

    const action = deferred();
    let result;
    await act(() => {
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
    const { captured, queryByTestId } = await renderWithBusy();
    const first = deferred();
    const second = deferred();
    let failed;

    await act(() => {
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

  it('não deve fechar pelo voltar do Android', async () => {
    const { captured, getByTestId, queryByTestId } = await renderWithBusy();
    await act(async () => {
      captured.track(new Promise(() => {}));
    });

    await fireEvent(getByTestId('busy-modal'), 'requestClose');
    expect(queryByTestId('busy-overlay')).toBeTruthy();
  });

  it('sem o provedor, deve só devolver a ação', async () => {
    const captured = {};
    function Probe() {
      captured.track = useBusy();
      return null;
    }
    await render(<Probe />);

    await expect(captured.track(Promise.resolve(3))).resolves.toBe(3);
  });
});
