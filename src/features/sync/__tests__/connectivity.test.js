import NetInfo from '@react-native-community/netinfo';
import { isOnline, onReconnect } from '../connectivity';

const state = (isConnected, isInternetReachable = isConnected) => ({
  isConnected,
  isInternetReachable,
});

describe('connectivity', () => {
  it('deve estar online só com rede e acesso à internet', async () => {
    NetInfo.fetch.mockResolvedValueOnce(state(true));
    await expect(isOnline()).resolves.toBe(true);

    NetInfo.fetch.mockResolvedValueOnce(state(true, false));
    await expect(isOnline()).resolves.toBe(false);

    NetInfo.fetch.mockResolvedValueOnce(state(false));
    await expect(isOnline()).resolves.toBe(false);

    // Ainda sem saber se há acesso: tenta (a requisição confirma)
    NetInfo.fetch.mockResolvedValueOnce(state(true, null));
    await expect(isOnline()).resolves.toBe(true);
  });

  it('deve avisar só quando a internet volta', () => {
    const stop = jest.fn();
    NetInfo.addEventListener.mockReturnValueOnce(stop);
    const callback = jest.fn();

    const unsubscribe = onReconnect(callback);
    const listener = NetInfo.addEventListener.mock.calls[0][0];
    listener(state(true));
    listener(state(false));
    listener(state(false));
    listener(state(true));
    listener(state(true));

    expect(callback).toHaveBeenCalledTimes(1);
    expect(unsubscribe).toBe(stop);
  });
});
