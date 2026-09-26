import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useSharePost } from '../useSharePost';
import { shareService } from '../../services/shareService';

jest.mock('../../services/shareService', () => ({
  shareService: { sharePoster: jest.fn() },
}));

jest.spyOn(Alert, 'alert');

describe('useSharePost', () => {
  const post = { id: '1', petName: 'Rex' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve abrir e fechar o cartaz do registro e compartilhar a imagem', async () => {
    const { result } = renderHook(() => useSharePost());
    expect(result.current.sharingPost).toBeNull();

    act(() => result.current.openShare(post));
    expect(result.current.sharingPost).toBe(post);

    await act(async () => {
      await result.current.sharePoster('ref-do-cartaz');
    });
    expect(shareService.sharePoster).toHaveBeenCalledWith('ref-do-cartaz');

    act(() => result.current.closeShare());
    expect(result.current.sharingPost).toBeNull();
  });

  it('deve avisar quando não for possível compartilhar', async () => {
    shareService.sharePoster.mockRejectedValueOnce(new Error('x'));
    const { result } = renderHook(() => useSharePost());

    await act(async () => {
      await result.current.sharePoster('ref');
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Não foi possível compartilhar',
      'Tente novamente em alguns instantes.'
    );
  });
});
