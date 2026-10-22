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

// Estado da navegação: a tela e, no registro, o post sendo editado
const goTo = (screen, editingPost = null) => ({ screen, editingPost });

// Telas em que a pessoa já entrou na conta
const SIGNED_IN = [SCREENS.HOME, SCREENS.PROFILE, SCREENS.REPORT];

// Transições permitidas: de quais telas (from) e para qual tela vão (to)
const TRANSITIONS = {
  // Sessão salva de um uso anterior: confirmar a identidade antes de entrar
  sessionRestored: {
    from: [SCREENS.LOADING],
    // Com sessão salva vai para o desbloqueio; sem, para o login
    to: ({ hasSession }) => goTo(hasSession ? SCREENS.UNLOCK : SCREENS.LOGIN),
  },
  // Entrou (login, cadastro ou desbloqueio): sem perfil, vai completá-lo
  authenticated: {
    from: [SCREENS.LOGIN, SCREENS.UNLOCK],
    // Com perfil vai para o feed; sem, para o cadastro do perfil
    to: ({ hasProfile }) =>
      goTo(hasProfile ? SCREENS.HOME : SCREENS.ONBOARDING),
  },
  onboardingCompleted: {
    from: [SCREENS.ONBOARDING],
    // Perfil completo: vai para o feed
    to: () => goTo(SCREENS.HOME),
  },
  homeOpened: { from: SIGNED_IN, to: () => goTo(SCREENS.HOME) },
  profileOpened: { from: [SCREENS.HOME], to: () => goTo(SCREENS.PROFILE) },
  // Sem `post`, abre um registro novo; com ele, a edição
  reportOpened: {
    from: [SCREENS.HOME, SCREENS.PROFILE],
    // Abre o registro, novo ou com o post a editar
    to: ({ post }) => goTo(SCREENS.REPORT, post || null),
  },
  loggedOut: {
    from: [SCREENS.UNLOCK, ...SIGNED_IN],
    // Saiu da conta: volta para o login
    to: () => goTo(SCREENS.LOGIN),
  },
};

// Aplica a transição pedida, se ela for permitida a partir da tela atual;
// senão, a navegação não muda
export function navigationReducer(state, action) {
  const transition = TRANSITIONS[action.type];
  if (!transition?.from.includes(state.screen)) return state;
  return transition.to(action);
}
