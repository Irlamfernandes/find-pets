import { useEffect, useReducer } from 'react';
import { useSession } from '../features/auth/hooks/useSession';
import { useBiometricOffer } from '../features/auth/hooks/useBiometricOffer';
import { profileService } from '../features/profile/services/profileService';
import { useAppAlert } from '../shared/components/AppAlert';
import { useBusy } from '../shared/components/BusyOverlay';
import { syncService } from '../features/sync/syncService';
import { useSyncLifecycle } from '../features/sync/useSyncLifecycle';
import { navigationReducer, INITIAL_NAVIGATION } from './navigation';

const loginAlert = ({ type, usuario }) => {
  if (type === 'register') {
    return {
      type: 'success',
      title: 'Conta criada',
      message: 'Agora complete seu perfil para começar.',
    };
  }
  return {
    type: 'success',
    title: 'Login realizado',
    message:
      type === 'biometric'
        ? 'Login realizado via Biometria com sucesso.'
        : `Bem-vindo de volta, ${usuario}!`,
  };
};

const profileCompleteAlert = (name) => ({
  type: 'success',
  title: 'Perfil completo',
  message: `Seja bem-vindo, ${name}! Seu cadastro foi salvo com sucesso.`,
});

async function hasSavedProfile() {
  try {
    return Boolean(await profileService.getProfile());
  } catch {
    return false;
  }
}

export function useAppFlow() {
  const { isLoading, session, saveUserSession, logout } = useSession();
  const showAlert = useAppAlert();
  const track = useBusy();
  const { offerBiometrics, passwordPromptProps } = useBiometricOffer();
  const [navigation, dispatch] = useReducer(
    navigationReducer,
    INITIAL_NAVIGATION
  );

  useEffect(() => {
    if (!isLoading) {
      dispatch({
        type: 'sessionRestored',
      });
    }
  }, [isLoading]);

  const enter = async () => {
    const hasProfile = await hasSavedProfile();
    dispatch({ type: 'authenticated', hasProfile });
    return hasProfile;
  };

  const handleLoginSuccess = async (data) => {
    await saveUserSession(data);
    await syncService.syncNow();
    const hasProfile = await enter();
    showAlert(loginAlert(data));
    if (data.type === 'credentials' && hasProfile) {
      await offerBiometrics(data.usuario, 'Entre mais rápido');
    }
  };

  const handleOnboardingComplete = async (profile) => {
    dispatch({ type: 'onboardingCompleted' });

    const offered = await offerBiometrics(
      session?.usuario,
      `Tudo pronto, ${profile.name}!`
    );
    if (!offered) showAlert(profileCompleteAlert(profile.name));
  };

  useSyncLifecycle(async () => {
    showAlert({
      type: 'warning',
      title: 'Entre novamente',
      message:
        'Sua sessão expirou. Entre com sua senha para voltar a sincronizar.',
    });
    await handleLogout();
  });

  const handleLogout = async () => {
    try {
      await track(logout());
      dispatch({ type: 'loggedOut' });
    } catch (error) {
      showAlert({
        type: 'danger',
        title: 'Não foi possível sair',
        message: `Tente novamente. ${error.message}`,
      });
    }
  };

  return {
    isLoading,
    session,
    navigation,
    passwordPromptProps,
    actions: {
      loginSucceeded: handleLoginSuccess,
      onboardingCompleted: handleOnboardingComplete,
      logout: handleLogout,
      openHome: () => dispatch({ type: 'homeOpened' }),
      openProfile: () => dispatch({ type: 'profileOpened' }),
      openReport: (post) => dispatch({ type: 'reportOpened', post }),
    },
  };
}
