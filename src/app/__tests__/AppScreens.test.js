import React from 'react';
import { render } from '@testing-library/react-native';
import { AppScreens } from '../AppScreens';
import { SCREENS } from '../navigation';

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
    loginSucceeded: jest.fn(),
    onboardingCompleted: jest.fn(),
    logout: jest.fn(),
    openHome: jest.fn(),
    openProfile: jest.fn(),
    openReport: jest.fn(),
  };
  const session = { usuario: 'ana@x.com' };
  const show = async (screen, editingPost = null) =>
    await render(
      <AppScreens
        navigation={{ screen, editingPost }}
        session={session}
        actions={actions}
      />
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve ligar as telas de entrada às ações do fluxo', async () => {
    await show(SCREENS.LOGIN);
    expect(received.Login.onLoginSuccess).toBe(actions.loginSucceeded);

    await show(SCREENS.ONBOARDING);
    expect(received.Onboarding.onComplete).toBe(actions.onboardingCompleted);
  });

  it('deve abrir o registro novo pelo feed e pelo perfil', async () => {
    await show(SCREENS.HOME);
    received.Feed.onOpenReport();
    expect(received.Feed.onOpenProfile).toBe(actions.openProfile);
    expect(received.Feed.onEditPost).toBe(actions.openReport);

    await show(SCREENS.PROFILE);
    received.Profile.onOpenReport();
    expect(received.Profile.onBack).toBe(actions.openHome);
    expect(received.Profile.onLogout).toBe(actions.logout);

    expect(actions.openReport).toHaveBeenCalledTimes(2);
    expect(actions.openReport).toHaveBeenCalledWith(null);
  });

  it('deve passar o registro em edição', async () => {
    const post = { id: '1' };
    await show(SCREENS.REPORT, post);
    expect(received.Report).toEqual({
      initialPost: post,
      onBack: actions.openHome,
      onSaved: actions.openHome,
    });
  });

  it('não deve mostrar nada numa tela sem componente', async () => {
    expect((await show(SCREENS.LOADING)).toJSON()).toBeNull();
  });
});
