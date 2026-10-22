import React from 'react';
import PropTypes from 'prop-types';
import LoginScreen from '../features/auth/screens/LoginScreen';
import UnlockScreen from '../features/auth/screens/UnlockScreen';
import OnboardingScreen from '../features/profile/screens/OnboardingScreen';
import ProfileScreen from '../features/profile/screens/ProfileScreen';
import FeedScreen from '../features/posts/screens/FeedScreen';
import ReportLostPetScreen from '../features/posts/screens/ReportLostPetScreen';
import { SCREENS } from './navigation';

// Componente de cada tela e as props dele, ligadas às ações do fluxo do app
const SCREEN_CONFIG = {
  [SCREENS.UNLOCK]: {
    component: UnlockScreen,
    // Desbloqueio: a conta salva, entrar ou trocar de conta
    props: ({ session, actions }) => ({
      usuario: session.usuario,
      onUnlocked: actions.unlocked,
      onSwitchAccount: actions.logout,
    }),
  },
  [SCREENS.LOGIN]: {
    component: LoginScreen,
    // Login e cadastro: avisa quando a pessoa entrou
    props: ({ actions }) => ({ onLoginSuccess: actions.loginSucceeded }),
  },
  [SCREENS.ONBOARDING]: {
    component: OnboardingScreen,
    // Cadastro do perfil: avisa quando terminou
    props: ({ actions }) => ({ onComplete: actions.onboardingCompleted }),
  },
  [SCREENS.HOME]: {
    component: FeedScreen,
    // Feed: abre o perfil, um registro novo ou a edição de um registro
    props: ({ actions }) => ({
      onOpenProfile: actions.openProfile,
      onOpenReport: () => actions.openReport(null),
      onEditPost: actions.openReport,
    }),
  },
  [SCREENS.REPORT]: {
    component: ReportLostPetScreen,
    // Registro: o post sendo editado (ou nenhum) e a volta para o feed
    props: ({ navigation, actions }) => ({
      initialPost: navigation.editingPost,
      onBack: actions.openHome,
      onSaved: actions.openHome,
    }),
  },
  [SCREENS.PROFILE]: {
    component: ProfileScreen,
    // Perfil: voltar, registrar um desaparecimento ou sair da conta
    props: ({ actions }) => ({
      onBack: actions.openHome,
      onOpenReport: () => actions.openReport(null),
      onLogout: actions.logout,
    }),
  },
};

// Mostra a tela atual da navegação, com as props montadas para ela
export function AppScreens({ navigation, session, actions }) {
  const config = SCREEN_CONFIG[navigation.screen];
  if (!config) return null;

  const Screen = config.component;
  return <Screen {...config.props({ navigation, session, actions })} />;
}

AppScreens.propTypes = {
  navigation: PropTypes.shape({
    screen: PropTypes.string.isRequired,
    editingPost: PropTypes.object,
  }).isRequired,
  session: PropTypes.object,
  actions: PropTypes.objectOf(PropTypes.func).isRequired,
};
