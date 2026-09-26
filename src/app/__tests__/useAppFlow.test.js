import { renderHook, act } from '@testing-library/react-native';
import { useAppFlow } from '../useAppFlow';
import { SCREENS } from '../navigation';
import { useSession } from '../../features/auth/hooks/useSession';
import { useBiometricOffer } from '../../features/auth/hooks/useBiometricOffer';
import { profileService } from '../../features/profile/services/profileService';
import { useAppAlert } from '../../shared/components/AppAlert';

jest.mock('../../features/auth/hooks/useSession');
jest.mock('../../features/auth/hooks/useBiometricOffer');
jest.mock('../../features/profile/services/profileService');
jest.mock('../../shared/components/AppAlert', () => ({
  useAppAlert: jest.fn(),
}));

describe('useAppFlow', () => {
  const showAlert = jest.fn();
  const offerBiometrics = jest.fn();
  let sessionState;

  beforeEach(() => {
    jest.clearAllMocks();
    sessionState = {
      isLoading: false,
      session: null,
      saveUserSession: jest.fn().mockResolvedValue(),
      logout: jest.fn().mockResolvedValue(),
    };
    useSession.mockImplementation(() => sessionState);
    useAppAlert.mockReturnValue(showAlert);
    useBiometricOffer.mockReturnValue({
      offerBiometrics,
      passwordPromptProps: { visible: false },
    });
    profileService.getProfile.mockResolvedValue({ name: 'Ana' });
  });

  const renderFlow = () => renderHook(() => useAppFlow());
  const screenOf = (hook) => hook.result.current.navigation.screen;

  it('deve esperar a sessão carregar para decidir a tela inicial', () => {
    sessionState.isLoading = true;
    const hook = renderFlow();
    expect(screenOf(hook)).toBe(SCREENS.LOADING);

    sessionState = { ...sessionState, isLoading: false };
    hook.rerender();
    expect(screenOf(hook)).toBe(SCREENS.LOGIN);
  });

  it('deve pedir o desbloqueio quando houver sessão salva e entrar em seguida', async () => {
    sessionState.session = { usuario: 'ana@x.com' };
    const hook = renderFlow();
    expect(screenOf(hook)).toBe(SCREENS.UNLOCK);

    await act(() => hook.result.current.actions.unlocked());
    expect(screenOf(hook)).toBe(SCREENS.HOME);
  });

  it('deve salvar a sessão ao entrar e avisar conforme a forma de entrada', async () => {
    const hook = renderFlow();

    await act(() =>
      hook.result.current.actions.loginSucceeded({
        type: 'credentials',
        usuario: 'ana@x.com',
      })
    );

    expect(sessionState.saveUserSession).toHaveBeenCalledWith({
      type: 'credentials',
      usuario: 'ana@x.com',
    });
    expect(showAlert).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Bem-vindo de volta, ana@x.com!' })
    );
    expect(screenOf(hook)).toBe(SCREENS.HOME);
  });

  it.each([
    ['biometric', 'Login realizado via Biometria com sucesso.'],
    ['register', 'Agora complete seu perfil para começar.'],
  ])('deve avisar a entrada do tipo %s', async (type, message) => {
    const hook = renderFlow();
    await act(() =>
      hook.result.current.actions.loginSucceeded({ type, usuario: 'a' })
    );
    expect(showAlert).toHaveBeenCalledWith(
      expect.objectContaining({ message })
    );
  });

  it('deve levar ao cadastro do perfil quando ele não existir ou falhar', async () => {
    profileService.getProfile.mockResolvedValueOnce(null);
    const hook = renderFlow();
    await act(() =>
      hook.result.current.actions.loginSucceeded({ type: 'register' })
    );
    expect(screenOf(hook)).toBe(SCREENS.ONBOARDING);

    profileService.getProfile.mockRejectedValueOnce(new Error('x'));
    const other = renderFlow();
    await act(() =>
      other.result.current.actions.loginSucceeded({ type: 'register' })
    );
    expect(screenOf(other)).toBe(SCREENS.ONBOARDING);
  });

  describe('fim do cadastro', () => {
    const completeOnboarding = async () => {
      profileService.getProfile.mockResolvedValueOnce(null);
      sessionState.session = { usuario: 'ana@x.com' };
      const hook = renderFlow();
      await act(() => hook.result.current.actions.unlocked());
      await act(() =>
        hook.result.current.actions.onboardingCompleted({ name: 'Ana' })
      );
      return hook;
    };

    it('deve guardar o perfil na sessão e oferecer a biometria', async () => {
      offerBiometrics.mockResolvedValueOnce(true);
      const hook = await completeOnboarding();

      expect(sessionState.saveUserSession).toHaveBeenCalledWith({
        usuario: 'ana@x.com',
        profile: { name: 'Ana' },
      });
      expect(offerBiometrics).toHaveBeenCalledWith('ana@x.com', 'Ana');
      expect(showAlert).not.toHaveBeenCalled();
      expect(screenOf(hook)).toBe(SCREENS.HOME);
    });

    it('deve dar boas-vindas quando a biometria não for oferecida', async () => {
      offerBiometrics.mockResolvedValueOnce(false);
      await completeOnboarding();
      expect(showAlert).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Perfil completo' })
      );
    });

    it('deve avisar quando não conseguir salvar a sessão', async () => {
      sessionState.saveUserSession.mockRejectedValueOnce(new Error('disco'));
      const hook = await completeOnboarding();
      expect(showAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Falha ao salvar sessão com o perfil. disco',
        })
      );
      expect(screenOf(hook)).toBe(SCREENS.ONBOARDING);
    });

    it('deve funcionar sem sessão carregada', async () => {
      offerBiometrics.mockResolvedValueOnce(false);
      profileService.getProfile.mockResolvedValueOnce(null);
      const hook = renderFlow();
      await act(() =>
        hook.result.current.actions.loginSucceeded({ type: 'register' })
      );
      await act(() =>
        hook.result.current.actions.onboardingCompleted({ name: 'Ana' })
      );
      expect(offerBiometrics).toHaveBeenCalledWith(undefined, 'Ana');
    });
  });

  it('deve navegar entre feed, perfil e registro', async () => {
    const hook = renderFlow();
    await act(() => hook.result.current.actions.loginSucceeded({}));
    const { actions } = hook.result.current;

    act(() => actions.openProfile());
    expect(screenOf(hook)).toBe(SCREENS.PROFILE);
    act(() => actions.openReport({ id: '1' }));
    expect(hook.result.current.navigation).toEqual({
      screen: SCREENS.REPORT,
      editingPost: { id: '1' },
    });
    act(() => actions.openHome());
    expect(screenOf(hook)).toBe(SCREENS.HOME);
  });

  it('deve sair da conta e avisar quando não conseguir', async () => {
    const hook = renderFlow();
    await act(() => hook.result.current.actions.loginSucceeded({}));

    sessionState.logout.mockRejectedValueOnce(new Error('falhou'));
    await act(() => hook.result.current.actions.logout());
    expect(showAlert).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Tente novamente. falhou' })
    );
    expect(screenOf(hook)).toBe(SCREENS.HOME);

    await act(() => hook.result.current.actions.logout());
    expect(screenOf(hook)).toBe(SCREENS.LOGIN);
  });
});
