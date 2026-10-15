import { useEffect, useReducer } from 'react';
import { useSession } from '../features/auth/hooks/useSession';
import { useBiometricOffer } from '../features/auth/hooks/useBiometricOffer';
import { profileService } from '../features/profile/services/profileService';
import { useAppAlert } from '../shared/components/AppAlert';
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

async function hasSavedProfile() {
  try {
    return Boolean(await profileService.getProfile());
  } catch {
    return false;
  }
}

// Fluxo principal do app: sessão, entrada, cadastro do perfil e navegação
export function useAppFlow() {
  const { isLoading, session, saveUserSession, logout } = useSession();
  const showAlert = useAppAlert();
  const { offerBiometrics, passwordPromptProps } = useBiometricOffer();
  const [navigation, dispatch] = useReducer(
    navigationReducer,
    INITIAL_NAVIGATION
  );

  // A tela inicial é decidida só ao abrir o app (a transição é ignorada
  // depois), senão o desbloqueio reapareceria a cada mudança de sessão
  useEffect(() => {
    if (!isLoading) {
      dispatch({
        type: 'sessionRestored',
        hasSession: Boolean(session?.usuario),
      });
    }
  }, [isLoading, session]);

  const enter = async () => {
    dispatch({ type: 'authenticated', hasProfile: await hasSavedProfile() });
  };

  // Reabriu o app: entra na hora e sincroniza em segundo plano
  const unlock = () => {
    syncService.syncNow();
    return enter();
  };

  // Sincroniza antes de entrar: num celular novo, traz o perfil e os
  // registros da conta (sem internet, entra com o que houver no aparelho)
  const handleLoginSuccess = async (data) => {
    showAlert(loginAlert(data));
    await saveUserSession(data);
    await syncService.syncNow();
    await enter();
  };

  // O perfil já foi gravado no banco pela tela de cadastro
  const handleOnboardingComplete = async (profile) => {
    dispatch({ type: 'onboardingCompleted' });

    // Fim do cadastro: convida a ativar a biometria, se estiver disponível
    const offered = await offerBiometrics(session?.usuario, profile.name);
    if (!offered) {
      showAlert({
        type: 'success',
        title: 'Perfil completo',
        message: `Seja bem-vindo, ${profile.name}! Seu cadastro foi salvo com sucesso.`,
      });
    }
  };

  // O servidor recusou o token: os dados continuam no celular, mas para
  // voltar a sincronizar é preciso entrar com a senha
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
      await logout();
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
      unlocked: unlock,
      loginSucceeded: handleLoginSuccess,
      onboardingCompleted: handleOnboardingComplete,
      logout: handleLogout,
      openHome: () => dispatch({ type: 'homeOpened' }),
      openProfile: () => dispatch({ type: 'profileOpened' }),
      openReport: (post) => dispatch({ type: 'reportOpened', post }),
    },
  };
}
