import { renderHook, act } from '@testing-library/react-native';
import { useFeedGuide } from '../useFeedGuide';
import { guideService } from '../../services/guideService';

jest.mock('../../services/guideService', () => ({
  guideService: {
    hasSeenFeedGuide: jest.fn(),
    markFeedGuideSeen: jest.fn(),
  },
}));

describe('useFeedGuide', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    guideService.markFeedGuideSeen.mockResolvedValue();
  });

  it('deve mostrar o aviso para quem ainda não viu e esconder ao dispensar', async () => {
    guideService.hasSeenFeedGuide.mockResolvedValueOnce(false);
    const { result } = renderHook(() => useFeedGuide('ana@test.com'));
    await act(async () => {});

    expect(result.current.isGuideVisible).toBe(true);

    await act(async () => {
      await result.current.dismissGuide();
    });
    expect(result.current.isGuideVisible).toBe(false);
    expect(guideService.markFeedGuideSeen).toHaveBeenCalledWith('ana@test.com');

    act(() => result.current.showGuide());
    expect(result.current.isGuideVisible).toBe(true);
  });

  it('não deve mostrar para quem já viu nem antes de saber o usuário', async () => {
    guideService.hasSeenFeedGuide.mockResolvedValueOnce(true);
    const { result, rerender } = renderHook(({ user }) => useFeedGuide(user), {
      initialProps: { user: null },
    });
    await act(async () => {});
    expect(guideService.hasSeenFeedGuide).not.toHaveBeenCalled();

    rerender({ user: 'ana@test.com' });
    await act(async () => {});
    expect(result.current.isGuideVisible).toBe(false);
  });

  it('deve mostrar o aviso se não conseguir ler e esconder mesmo se falhar ao salvar', async () => {
    guideService.hasSeenFeedGuide.mockRejectedValueOnce(new Error('x'));
    guideService.markFeedGuideSeen.mockRejectedValueOnce(new Error('y'));
    const { result } = renderHook(() => useFeedGuide('ana@test.com'));
    await act(async () => {});
    expect(result.current.isGuideVisible).toBe(true);

    await act(async () => {
      await result.current.dismissGuide();
    });
    expect(result.current.isGuideVisible).toBe(false);
  });

  it('deve ignorar a resposta se o componente desmontar antes', async () => {
    let finish;
    guideService.hasSeenFeedGuide.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    const { unmount } = renderHook(() => useFeedGuide('ana@test.com'));
    unmount();

    await act(async () => {
      finish(false);
    });
  });
});
