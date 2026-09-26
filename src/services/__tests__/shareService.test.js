import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { shareService } from '../shareService';

jest.mock('react-native-view-shot', () => ({ captureRef: jest.fn() }));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

describe('shareService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve gerar a imagem do cartaz e compartilhá-la', async () => {
    Sharing.isAvailableAsync.mockResolvedValueOnce(true);
    captureRef.mockResolvedValueOnce('file:///cache/cartaz.jpg');
    const posterRef = { current: 'view' };

    await shareService.sharePoster(posterRef);

    expect(captureRef).toHaveBeenCalledWith(posterRef, {
      format: 'jpg',
      quality: 0.9,
      result: 'tmpfile',
    });
    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      'file:///cache/cartaz.jpg',
      { mimeType: 'image/jpeg', dialogTitle: 'Compartilhar cartaz do pet' }
    );
  });

  it('deve falhar quando o compartilhamento não existir no aparelho', async () => {
    Sharing.isAvailableAsync.mockResolvedValueOnce(false);

    await expect(shareService.sharePoster({})).rejects.toThrow(
      'O compartilhamento não está disponível neste aparelho.'
    );
    expect(captureRef).not.toHaveBeenCalled();
  });
});
