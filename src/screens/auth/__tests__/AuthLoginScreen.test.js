import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AuthLoginScreen } from '../AuthLoginScreen';

describe('AuthLoginScreen Component', () => {
  const defaultProps = {
    usuario: '',
    setUsuario: jest.fn(),
    senha: '',
    setSenha: jest.fn(),
    hasHardwareBiometric: true,
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

    const inputUsuario = getByPlaceholderText('Usuário');
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
});
