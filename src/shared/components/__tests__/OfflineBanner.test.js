import React from 'react';
import { render } from '@testing-library/react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { OfflineBanner } from '../OfflineBanner';

describe('OfflineBanner', () => {
  it('deve aparecer só quando o celular está sem internet', () => {
    useNetInfo.mockReturnValueOnce({ isConnected: true });
    const online = render(<OfflineBanner />);
    expect(online.queryByText(/sem internet/)).toBeNull();

    // Antes de o sistema informar a conexão, não exibe nada
    useNetInfo.mockReturnValueOnce({ isConnected: null });
    const unknown = render(<OfflineBanner />);
    expect(unknown.queryByText(/sem internet/)).toBeNull();

    useNetInfo.mockReturnValueOnce({ isConnected: false });
    const offline = render(<OfflineBanner />);
    expect(offline.getByText(/Você está sem internet/)).toBeTruthy();
  });
});
