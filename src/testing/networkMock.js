// expo-network para os testes: por padrão, conectado e com internet. Cada
// teste pode trocar o estado com mockResolvedValueOnce / mockReturnValueOnce.
const ONLINE = { type: 'WIFI', isConnected: true, isInternetReachable: true };

function createNetworkMock() {
  return {
    NetworkStateType: { WIFI: 'WIFI', NONE: 'NONE' },
    getNetworkStateAsync: jest.fn(async () => ONLINE),
    addNetworkStateListener: jest.fn(() => ({ remove: jest.fn() })),
    useNetworkState: jest.fn(() => ONLINE),
  };
}

module.exports = { createNetworkMock };
