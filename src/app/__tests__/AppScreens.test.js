import React from 'react';
import { render } from '@testing-library/react-native';
import { AppScreens } from '../AppScreens';
import { SCREENS } from '../navigation';

// Cada tela vira um componente simples que guarda as props recebidas.
// Declarações de função são içadas junto com os jest.mock.
const received = {};
function mockScreen(name) {
  const Screen = (props) => {
    received[name] = props;
    return null;
  };
  Screen.displayName = name;
  return { __esModule: true, default: Screen };
}

jest.mock('../../features/auth/screens/LoginScreen', () => mockScreen('Login'));
jest.mock('../../features/auth/screens/UnlockScreen', () =>
  mockScreen('Unlock')
);
jest.mock('../../features/profile/screens/OnboardingScreen', () =>
  mockScreen('Onboarding')
);
jest.mock('../../features/profile/screens/ProfileScreen', () =>
  mockScreen('Profile')
);
jest.mock('../../features/posts/screens/FeedScreen', () => mockScreen('Feed'));
jest.mock('../../features/posts/screens/ReportLostPetScreen', () =>
  mockScreen('Report')
);

describe('AppScreens', () => {
  const actions = {
    unlocked: jest.fn(),
    loginSucceeded: jest.fn(),
    onboardingCompleted: jest.fn(),
    logout: jest.fn(),
    openHome: jest.fn(),
    openProfile: jest.fn(),
    openReport: jest.fn(),
  };
  const session = { usuario: 'ana@x.com' };
  const show = (screen, editingPost = null) =>
    render(
      <AppScreens
        navigation={{ screen, editingPost }}
        session={session}
        actions={actions}
      />
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve ligar as telas de entrada às ações do fluxo', () => {
    show(SCREENS.UNLOCK);
    expect(received.Unlock).toEqual({
      usuario: 'ana@x.com',
      onUnlocked: actions.unlocked,
      onSwitchAccount: actions.logout,
    });

    show(SCREENS.LOGIN);
    expect(received.Login.onLoginSuccess).toBe(actions.loginSucceeded);

    show(SCREENS.ONBOARDING);
    expect(received.Onboarding.onComplete).toBe(actions.onboardingCompleted);
  });

  it('deve abrir o registro novo pelo feed e pelo perfil', () => {
    show(SCREENS.HOME);
    received.Feed.onOpenReport();
    expect(received.Feed.onOpenProfile).toBe(actions.openProfile);
    expect(received.Feed.onEditPost).toBe(actions.openReport);

    show(SCREENS.PROFILE);
    received.Profile.onOpenReport();
    expect(received.Profile.onBack).toBe(actions.openHome);
    expect(received.Profile.onLogout).toBe(actions.logout);

    expect(actions.openReport).toHaveBeenCalledTimes(2);
    expect(actions.openReport).toHaveBeenCalledWith(null);
  });

  it('deve passar o registro em edição', () => {
    const post = { id: '1' };
    show(SCREENS.REPORT, post);
    expect(received.Report).toEqual({
      initialPost: post,
      onBack: actions.openHome,
      onSaved: actions.openHome,
    });
  });

  it('não deve mostrar nada numa tela sem componente', () => {
    expect(show(SCREENS.LOADING).toJSON()).toBeNull();
  });
});
