import { addNetworkStateListener, getNetworkStateAsync } from 'expo-network';
import { isOnline, onReconnect } from '../connectivity';

const state = (isConnected, isInternetReachable = isConnected) => ({
  isConnected,
  isInternetReachable,
});

describe('connectivity', () => {
  it('deve estar online só com rede e acesso à internet', async () => {
    getNetworkStateAsync.mockResolvedValueOnce(state(true));
    await expect(isOnline()).resolves.toBe(true);

    getNetworkStateAsync.mockResolvedValueOnce(state(true, false));
    await expect(isOnline()).resolves.toBe(false);

    getNetworkStateAsync.mockResolvedValueOnce(state(false));
    await expect(isOnline()).resolves.toBe(false);

    // Ainda sem saber se há acesso: tenta (a requisição confirma)
    getNetworkStateAsync.mockResolvedValueOnce(state(true, undefined));
    await expect(isOnline()).resolves.toBe(true);
  });

  it('deve avisar só quando a internet volta e parar de observar', () => {
    const remove = jest.fn();
    addNetworkStateListener.mockReturnValueOnce({ remove });
    const callback = jest.fn();

    const stop = onReconnect(callback);
    const listener = addNetworkStateListener.mock.calls[0][0];
    listener(state(true));
    listener(state(false));
    listener(state(false));
    listener(state(true));
    listener(state(true));

    expect(callback).toHaveBeenCalledTimes(1);
    stop();
    expect(remove).toHaveBeenCalled();
  });
});
