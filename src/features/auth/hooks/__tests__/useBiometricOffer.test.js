import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useBiometricOffer } from '../useBiometricOffer';
import { biometricService } from '../../services/biometrics';
import { accountService } from '../../services/accountService';

jest.mock('../../services/biometrics', () => ({
  biometricService: { checkAvailability: jest.fn(), authenticate: jest.fn() },
}));

jest.mock('../../services/accountService');

jest.spyOn(Alert, 'alert');

describe('useBiometricOffer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    biometricService.checkAvailability.mockResolvedValue(true);
    accountService.getBiometricOwner.mockResolvedValue(null);
    accountService.setBiometrics.mockResolvedValue();
    accountService.checkPassword.mockResolvedValue(true);
  });

  // Exibe o convite e escolhe uma das opções
  const offerAndChoose = async (choice) => {
    const hook = renderHook(() => useBiometricOffer());
    let offered;
    await act(async () => {
      offered = await hook.result.current.offerBiometrics(
        'ana@test.com',
        'Ana'
      );
    });
    expect(offered).toBe(true);

    const [title, message, buttons] = Alert.alert.mock.calls.at(-1);
    expect(title).toBe('Tudo pronto, Ana!');
    expect(message).toContain(
      'qualquer digital ou rosto cadastrado neste celular poderá entrar nesta conta'
    );
    await act(async () => {
      await buttons.find((button) => button.text === choice).onPress();
    });
    return hook;
  };

  const confirm = async (hook, password) => {
    let accepted;
    await act(async () => {
      accepted =
        await hook.result.current.passwordPromptProps.onConfirm(password);
    });
    return accepted;
  };

  it('deve pedir a senha ao escolher "Ativar agora" e então ativar', async () => {
    biometricService.authenticate.mockResolvedValueOnce({ success: true });
    const hook = await offerAndChoose('Ativar agora');

    expect(hook.result.current.passwordPromptProps).toEqual(
      expect.objectContaining({
        visible: true,
        title: 'Ativar biometria',
        errorMessage: '',
      })
    );
    // A biometria só é pedida depois da senha
    expect(biometricService.authenticate).not.toHaveBeenCalled();

    expect(await confirm(hook, 'senha123')).toBe(true);
    expect(accountService.checkPassword).toHaveBeenCalledWith(
      'ana@test.com',
      'senha123'
    );
    expect(accountService.setBiometrics).toHaveBeenCalledWith(
      'ana@test.com',
      true
    );
    expect(hook.result.current.passwordPromptProps.visible).toBe(false);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Biometria ativada',
      'Da próxima vez, você poderá entrar com a biometria.'
    );
  });

  it('deve validar a senha e não ativar sem ela', async () => {
    const hook = await offerAndChoose('Ativar agora');

    expect(await confirm(hook, '  ')).toBe(false);
    expect(hook.result.current.passwordPromptProps.errorMessage).toBe(
      'Digite sua senha.'
    );

    accountService.checkPassword.mockResolvedValueOnce(false);
    expect(await confirm(hook, 'errada')).toBe(false);
    expect(hook.result.current.passwordPromptProps.errorMessage).toBe(
      'Senha incorreta. Tente novamente.'
    );

    accountService.checkPassword.mockRejectedValueOnce(new Error('x'));
    expect(await confirm(hook, 'x')).toBe(false);
    expect(hook.result.current.passwordPromptProps.errorMessage).toBe(
      'Não foi possível verificar a senha agora.'
    );

    expect(biometricService.authenticate).not.toHaveBeenCalled();
    expect(accountService.setBiometrics).not.toHaveBeenCalled();

    act(() => hook.result.current.passwordPromptProps.onCancel());
    expect(hook.result.current.passwordPromptProps).toEqual(
      expect.objectContaining({ visible: false, errorMessage: '' })
    );
  });

  it('não deve pedir senha nem ativar ao escolher "Depois"', async () => {
    const hook = await offerAndChoose('Depois');

    expect(hook.result.current.passwordPromptProps.visible).toBe(false);
    expect(biometricService.authenticate).not.toHaveBeenCalled();
  });

  it('deve orientar quando a biometria não for confirmada ou falhar', async () => {
    biometricService.authenticate.mockResolvedValueOnce({
      success: false,
      error: 'lockout',
    });
    let hook = await offerAndChoose('Ativar agora');
    await confirm(hook, 'senha123');
    expect(Alert.alert).toHaveBeenCalledWith(
      'Biometria não confirmada',
      'Você pode ativá-la depois, no seu Perfil.'
    );

    biometricService.authenticate.mockResolvedValueOnce({ success: true });
    accountService.setBiometrics.mockRejectedValueOnce(new Error('x'));
    hook = await offerAndChoose('Ativar agora');
    await confirm(hook, 'senha123');
    expect(Alert.alert).toHaveBeenCalledWith(
      'Não foi possível ativar',
      'Tente novamente depois, no seu Perfil.'
    );
  });

  it('não deve mostrar nada extra se a pessoa cancelar a biometria', async () => {
    biometricService.authenticate.mockResolvedValueOnce({
      success: false,
      error: 'user_cancel',
    });
    const hook = await offerAndChoose('Ativar agora');
    await confirm(hook, 'senha123');

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(accountService.setBiometrics).not.toHaveBeenCalled();
  });

  it('não deve oferecer sem biometria no celular, se outra conta já usa ou com erro', async () => {
    const { result } = renderHook(() => useBiometricOffer());
    const offer = () => result.current.offerBiometrics('ana@test.com', 'Ana');

    biometricService.checkAvailability.mockResolvedValueOnce(false);
    await expect(offer()).resolves.toBe(false);

    accountService.getBiometricOwner.mockResolvedValueOnce({
      usuario: 'outra@test.com',
    });
    await expect(offer()).resolves.toBe(false);

    accountService.getBiometricOwner.mockRejectedValueOnce(new Error('x'));
    await expect(offer()).resolves.toBe(false);

    expect(Alert.alert).not.toHaveBeenCalled();
  });
});
