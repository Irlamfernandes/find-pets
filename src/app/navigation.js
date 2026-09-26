// Navegação do app como máquina de estados: cada ação só é aceita a partir
// das telas listadas em `from`; qualquer outra combinação é ignorada.

export const SCREENS = {
  LOADING: 'loading',
  UNLOCK: 'unlock',
  LOGIN: 'login',
  ONBOARDING: 'onboarding',
  HOME: 'home',
  PROFILE: 'profile',
  REPORT: 'report',
};

export const INITIAL_NAVIGATION = {
  screen: SCREENS.LOADING,
  editingPost: null,
};

const goTo = (screen, editingPost = null) => ({ screen, editingPost });

const SIGNED_IN = [SCREENS.HOME, SCREENS.PROFILE, SCREENS.REPORT];

const TRANSITIONS = {
  // Sessão salva de um uso anterior: confirmar a identidade antes de entrar
  sessionRestored: {
    from: [SCREENS.LOADING],
    to: ({ hasSession }) => goTo(hasSession ? SCREENS.UNLOCK : SCREENS.LOGIN),
  },
  // Entrou (login, cadastro ou desbloqueio): sem perfil, vai completá-lo
  authenticated: {
    from: [SCREENS.LOGIN, SCREENS.UNLOCK],
    to: ({ hasProfile }) =>
      goTo(hasProfile ? SCREENS.HOME : SCREENS.ONBOARDING),
  },
  onboardingCompleted: {
    from: [SCREENS.ONBOARDING],
    to: () => goTo(SCREENS.HOME),
  },
  homeOpened: { from: SIGNED_IN, to: () => goTo(SCREENS.HOME) },
  profileOpened: { from: [SCREENS.HOME], to: () => goTo(SCREENS.PROFILE) },
  // Sem `post`, abre um registro novo; com ele, a edição
  reportOpened: {
    from: [SCREENS.HOME, SCREENS.PROFILE],
    to: ({ post }) => goTo(SCREENS.REPORT, post || null),
  },
  loggedOut: {
    from: [SCREENS.UNLOCK, ...SIGNED_IN],
    to: () => goTo(SCREENS.LOGIN),
  },
};

export function navigationReducer(state, action) {
  const transition = TRANSITIONS[action.type];
  if (!transition?.from.includes(state.screen)) return state;
  return transition.to(action);
}
