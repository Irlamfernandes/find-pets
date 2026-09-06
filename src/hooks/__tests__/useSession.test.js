import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useSession } from '../useSession';
import { sessionService } from '../../services/session';

jest.mock('../../services/session', () => ({
  sessionService: {
    getSession: jest.fn(),
    saveSession: jest.fn(),
    clearSession: jest.fn(),
  },
}));

describe('useSession Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve carregar a sessão existente na inicialização', async () => {
    const mockSession = { type: 'biometric', email: 'test@test.com' };
    sessionService.getSession.mockResolvedValueOnce(mockSession);

    const { result } = renderHook(() => useSession());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.session).toEqual(mockSession);
  });

  it('deve lidar com ausência de sessão na inicialização', async () => {
    sessionService.getSession.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.session).toBeNull();
  });

  it('deve salvar a sessão corretamente', async () => {
    sessionService.getSession.mockResolvedValueOnce(null);
    sessionService.saveSession.mockResolvedValueOnce();

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newSession = { type: 'manual', email: 'user@test.com' };

    await act(async () => {
      await result.current.saveUserSession(newSession);
    });

    expect(sessionService.saveSession).toHaveBeenCalledWith(newSession);
    expect(result.current.session).toEqual(newSession);
  });

  it('deve limpar a sessão no logout', async () => {
    const mockSession = { type: 'biometric' };
    sessionService.getSession.mockResolvedValueOnce(mockSession);
    sessionService.clearSession.mockResolvedValueOnce();

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.session).toEqual(mockSession);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(sessionService.clearSession).toHaveBeenCalled();
    expect(result.current.session).toBeNull();
  });

  it('deve lidar com erro ao carregar a sessão na inicialização', async () => {
    sessionService.getSession.mockRejectedValueOnce(new Error('Storage error'));

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.session).toBeNull();
  });
});
