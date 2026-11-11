import React from 'react';
import { render } from '@testing-library/react-native';
import { useNetworkState } from 'expo-network';
import { OfflineBanner } from '../OfflineBanner';

describe('OfflineBanner', () => {
  it('deve aparecer só quando o celular está sem internet', async () => {
    useNetworkState.mockReturnValueOnce({ isConnected: true });
    const online = await render(<OfflineBanner />);
    expect(online.queryByText(/sem internet/)).toBeNull();

    useNetworkState.mockReturnValueOnce({});
    const unknown = await render(<OfflineBanner />);
    expect(unknown.queryByText(/sem internet/)).toBeNull();

    useNetworkState.mockReturnValueOnce({ isConnected: false });
    const offline = await render(<OfflineBanner />);
    expect(offline.getByText(/Você está sem internet/)).toBeTruthy();
  });
});
