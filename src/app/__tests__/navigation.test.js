import { navigationReducer, INITIAL_NAVIGATION, SCREENS } from '../navigation';

const at = (screen, editingPost = null) => ({ screen, editingPost });

describe('navigationReducer', () => {
  it('deve decidir a tela inicial pela sessão salva', () => {
    expect(
      navigationReducer(INITIAL_NAVIGATION, {
        type: 'sessionRestored',
        hasSession: true,
      })
    ).toEqual(at(SCREENS.UNLOCK));
    expect(
      navigationReducer(INITIAL_NAVIGATION, {
        type: 'sessionRestored',
        hasSession: false,
      })
    ).toEqual(at(SCREENS.LOGIN));
  });

  it('deve levar ao cadastro do perfil só quando ele ainda não existe', () => {
    expect(
      navigationReducer(at(SCREENS.LOGIN), {
        type: 'authenticated',
        hasProfile: false,
      })
    ).toEqual(at(SCREENS.ONBOARDING));
    expect(
      navigationReducer(at(SCREENS.UNLOCK), {
        type: 'authenticated',
        hasProfile: true,
      })
    ).toEqual(at(SCREENS.HOME));
    expect(
      navigationReducer(at(SCREENS.ONBOARDING), { type: 'onboardingCompleted' })
    ).toEqual(at(SCREENS.HOME));
  });

  it('deve abrir o registro novo ou em edição e voltar ao feed', () => {
    const post = { id: '1' };
    const report = navigationReducer(at(SCREENS.HOME), {
      type: 'reportOpened',
      post,
    });
    expect(report).toEqual(at(SCREENS.REPORT, post));

    expect(
      navigationReducer(at(SCREENS.PROFILE), { type: 'reportOpened' })
    ).toEqual(at(SCREENS.REPORT));
    expect(navigationReducer(report, { type: 'homeOpened' })).toEqual(
      at(SCREENS.HOME)
    );
    expect(
      navigationReducer(at(SCREENS.HOME), { type: 'profileOpened' })
    ).toEqual(at(SCREENS.PROFILE));
  });

  it('deve sair da conta a partir das telas de quem está conectado', () => {
    for (const screen of [SCREENS.UNLOCK, SCREENS.HOME, SCREENS.PROFILE]) {
      expect(navigationReducer(at(screen), { type: 'loggedOut' })).toEqual(
        at(SCREENS.LOGIN)
      );
    }
  });

  it('deve ignorar transições inválidas ou desconhecidas', () => {
    const login = at(SCREENS.LOGIN);
    // Ex.: o desbloqueio não pode reaparecer depois de entrar
    expect(
      navigationReducer(at(SCREENS.HOME), {
        type: 'sessionRestored',
        hasSession: true,
      })
    ).toEqual(at(SCREENS.HOME));
    expect(navigationReducer(login, { type: 'homeOpened' })).toBe(login);
    expect(navigationReducer(login, { type: 'desconhecida' })).toBe(login);
  });
});
