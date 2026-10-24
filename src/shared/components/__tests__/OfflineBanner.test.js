import React from 'react';
import { render } from '@testing-library/react-native';
import { useNetworkState } from 'expo-network';
import { OfflineBanner } from '../OfflineBanner';

describe('OfflineBanner', () => {
  it('deve aparecer só quando o celular está sem internet', () => {
    useNetworkState.mockReturnValueOnce({ isConnected: true });
    const online = render(<OfflineBanner />);
    expect(online.queryByText(/sem internet/)).toBeNull();

    // Antes de o sistema informar a conexão, não exibe nada
    useNetworkState.mockReturnValueOnce({});
    const unknown = render(<OfflineBanner />);
    expect(unknown.queryByText(/sem internet/)).toBeNull();

    useNetworkState.mockReturnValueOnce({ isConnected: false });
    const offline = render(<OfflineBanner />);
    expect(offline.getByText(/Você está sem internet/)).toBeTruthy();
  });
});
