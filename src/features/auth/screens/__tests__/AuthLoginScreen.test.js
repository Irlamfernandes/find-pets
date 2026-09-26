import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Platform, TextInput, BackHandler } from 'react-native';
import { AuthLoginScreen } from '../AuthLoginScreen';

const pressHardwareBack = () => {
  const [, listener] = BackHandler.addEventListener.mock.calls.at(-1);
  return listener();
};

describe('AuthLoginScreen Component', () => {
  const defaultProps = {
    usuario: '',
    setUsuario: jest.fn(),
    senha: '',
    setSenha: jest.fn(),
    hasHardwareBiometric: true,
    biometricOwner: 'irlam@gmail.com',
    errorMessage: '',
    handleManualLogin: jest.fn(),
    triggerBiometricAuth: jest.fn(),
    onBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar a tela de login, inputs e botões corretamente', () => {
    const { getByText, getByPlaceholderText } = render(
      <AuthLoginScreen {...defaultProps} />
    );

    expect(getByText('Login')).toBeTruthy();
    expect(getByText('Entre com sua conta')).toBeTruthy();

    const inputUsuario = getByPlaceholderText('E-mail');
    const inputSenha = getByPlaceholderText('Senha');

    fireEvent.changeText(inputUsuario, 'teste@email.com');
    fireEvent.changeText(inputSenha, '123456');

    expect(defaultProps.setUsuario).toHaveBeenCalledWith('teste@email.com');
    expect(defaultProps.setSenha).toHaveBeenCalledWith('123456');

    fireEvent.press(getByText('Entrar com Senha'));
    expect(defaultProps.handleManualLogin).toHaveBeenCalled();

    fireEvent.press(getByText('Entrar com Biometria'));
    expect(defaultProps.triggerBiometricAuth).toHaveBeenCalled();

    fireEvent.press(getByText('Voltar'));
    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it('não deve renderizar o botão de biometria se hasHardwareBiometric for falso', () => {
    const { queryByText } = render(
      <AuthLoginScreen {...defaultProps} hasHardwareBiometric={false} />
    );

    expect(queryByText('Entrar com Biometria')).toBeNull();
  });

  it('deve executar o login ao confirmar no teclado', () => {
    const { getByPlaceholderText } = render(
      <AuthLoginScreen {...defaultProps} />
    );

    fireEvent(getByPlaceholderText('Senha'), 'submitEditing');

    expect(defaultProps.handleManualLogin).toHaveBeenCalledTimes(1);
  });

  it('deve exibir mensagem de erro quando errorMessage for fornecido', () => {
    const { getByText } = render(
      <AuthLoginScreen {...defaultProps} errorMessage="Senha incorreta" />
    );

    expect(getByText('Senha incorreta')).toBeTruthy();
  });

  it('não deve exibir mensagem de erro quando errorMessage estiver vazio', () => {
    const { queryByText } = render(
      <AuthLoginScreen {...defaultProps} errorMessage="" />
    );

    expect(queryByText('Senha incorreta')).toBeNull();
  });

  it('deve renderizar corretamente no ambiente Android', () => {
    const originalOS = Platform.OS;
    Platform.OS = 'android';

    const { getByText } = render(<AuthLoginScreen {...defaultProps} />);
    expect(getByText('Login')).toBeTruthy();

    Platform.OS = originalOS;
  });

  it('deve ir para o campo de senha ao confirmar o e-mail no teclado', () => {
    const focusSpy = jest.spyOn(TextInput.prototype, 'focus');
    const { getByPlaceholderText } = render(
      <AuthLoginScreen {...defaultProps} />
    );

    fireEvent(getByPlaceholderText('E-mail'), 'submitEditing');

    expect(focusSpy).toHaveBeenCalledTimes(1);
    expect(defaultProps.handleManualLogin).not.toHaveBeenCalled();
    focusSpy.mockRestore();
  });

  it('deve executar a seta de voltar ao usar o voltar do Android', () => {
    jest.spyOn(BackHandler, 'addEventListener');
    render(<AuthLoginScreen {...defaultProps} />);

    expect(pressHardwareBack()).toBe(true);
    expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
    BackHandler.addEventListener.mockRestore();
  });

  it('deve mostrar de qual conta é a biometria e escondê-la sem dona', () => {
    const { getByText, queryByText, rerender } = render(
      <AuthLoginScreen {...defaultProps} />
    );
    expect(getByText('ir***@gmail.com')).toBeTruthy();

    rerender(<AuthLoginScreen {...defaultProps} biometricOwner={null} />);
    expect(queryByText('Entrar com Biometria')).toBeNull();
  });
});
