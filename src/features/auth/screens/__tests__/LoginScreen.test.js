import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LoginScreen from '../LoginScreen';
import { useLogin } from '../../hooks/useLogin';

jest.mock('../../hooks/useLogin');

describe('LoginScreen Component', () => {
  const mockSetAuthMode = jest.fn();
  const mockSetUsuario = jest.fn();
  const mockSetSenha = jest.fn();
  const mockHandleRegister = jest.fn();
  const mockHandleManualLogin = jest.fn();
  const mockTriggerBiometricAuth = jest.fn();

  const baseHookValues = {
    usuario: '',
    setUsuario: mockSetUsuario,
    senha: '',
    setSenha: mockSetSenha,
    hasHardwareBiometric: true,
    biometricOwner: 'irlam@gmail.com',
    errorMessage: '',
    authMode: 'home',
    setAuthMode: mockSetAuthMode,
    handleRegister: mockHandleRegister,
    handleManualLogin: mockHandleManualLogin,
    triggerBiometricAuth: mockTriggerBiometricAuth,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useLogin.mockReturnValue(baseHookValues);
  });

  it('deve renderizar a tela Home corretamente e navegar para Login ou Cadastro', () => {
    const { getByText } = render(<LoginScreen onLoginSuccess={jest.fn()} />);

    expect(getByText('FindPets')).toBeTruthy();
    expect(getByText('Escolha uma opção')).toBeTruthy();

    fireEvent.press(getByText('Login'));
    expect(mockSetAuthMode).toHaveBeenCalledWith('login');

    fireEvent.press(getByText('Cadastrar'));
    expect(mockSetAuthMode).toHaveBeenCalledWith('cadastro');
  });

  it('deve mostrar a biometria na tela inicial só com o leitor disponível', () => {
    const { getByTestId, queryByTestId, rerender } = render(
      <LoginScreen onLoginSuccess={jest.fn()} />
    );

    fireEvent.press(getByTestId('button-home-biometrics'));
    expect(mockTriggerBiometricAuth).toHaveBeenCalledTimes(1);

    useLogin.mockReturnValue({
      ...baseHookValues,
      hasHardwareBiometric: false,
    });
    rerender(<LoginScreen onLoginSuccess={jest.fn()} />);
    expect(queryByTestId('button-home-biometrics')).toBeNull();
  });

  it('deve renderizar a tela de Cadastro e disparar as ações corretamente', () => {
    useLogin.mockReturnValue({
      ...baseHookValues,
      authMode: 'cadastro',
      errorMessage: 'Erro de teste',
    });

    const { getByText, getByPlaceholderText } = render(
      <LoginScreen onLoginSuccess={jest.fn()} />
    );

    expect(getByText('Cadastro')).toBeTruthy();
    expect(getByText('Erro de teste')).toBeTruthy();

    const inputUsuario = getByPlaceholderText('E-mail');
    const inputSenha = getByPlaceholderText('Senha');

    fireEvent.changeText(inputUsuario, 'novo@test.com');
    fireEvent.changeText(inputSenha, '123456');

    expect(mockSetUsuario).toHaveBeenCalledWith('novo@test.com');
    expect(mockSetSenha).toHaveBeenCalledWith('123456');

    fireEvent.press(getByText('Criar conta'));
    expect(mockHandleRegister).toHaveBeenCalled();

    fireEvent.press(getByText('Voltar'));
    expect(mockSetAuthMode).toHaveBeenCalledWith('home');
  });

  it('não deve exibir mensagem de erro se errorMessage estiver vazio no Cadastro', () => {
    useLogin.mockReturnValue({
      ...baseHookValues,
      authMode: 'cadastro',
      errorMessage: '',
    });

    const { queryByText } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
    expect(queryByText('Erro de teste')).toBeNull();
  });

  it('deve renderizar a tela de Login, campos, botões e biometria', () => {
    useLogin.mockReturnValue({
      ...baseHookValues,
      authMode: 'login',
    });

    const { getByText, getByPlaceholderText } = render(
      <LoginScreen onLoginSuccess={jest.fn()} />
    );

    expect(getByText('Login')).toBeTruthy();

    const inputUsuario = getByPlaceholderText('E-mail');
    const inputSenha = getByPlaceholderText('Senha');

    fireEvent.changeText(inputUsuario, 'user@test.com');
    fireEvent.changeText(inputSenha, '123456');

    expect(mockSetUsuario).toHaveBeenCalledWith('user@test.com');
    expect(mockSetSenha).toHaveBeenCalledWith('123456');

    fireEvent.press(getByText('Entrar com Senha'));
    expect(mockHandleManualLogin).toHaveBeenCalled();

    fireEvent.press(getByText('Entrar com Biometria'));
    expect(mockTriggerBiometricAuth).toHaveBeenCalled();

    fireEvent.press(getByText('Voltar'));
    expect(mockSetAuthMode).toHaveBeenCalledWith('home');
  });

  it('não deve renderizar o botão de biometria se hasHardwareBiometric for falso', () => {
    useLogin.mockReturnValue({
      ...baseHookValues,
      authMode: 'login',
      hasHardwareBiometric: false,
    });

    const { queryByText } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
    expect(queryByText('Entrar com Biometria')).toBeNull();
  });

  it('não deve exibir mensagem de erro se errorMessage estiver vazio no Login', () => {
    useLogin.mockReturnValue({
      ...baseHookValues,
      authMode: 'login',
      errorMessage: '',
    });

    const { queryByText } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
    expect(queryByText('Erro crítico de login')).toBeNull();
  });

  it('deve exibir mensagem de erro se errorMessage estiver preenchido no Login', () => {
    useLogin.mockReturnValue({
      ...baseHookValues,
      authMode: 'login',
      errorMessage: 'Erro crítico de login',
    });

    const { getByText } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
    expect(getByText('Erro crítico de login')).toBeTruthy();
  });

  it('deve renderizar a AuthLoginScreen por padrão quando authMode for diferente de home e cadastro', () => {
    useLogin.mockReturnValue({
      ...baseHookValues,
      authMode: 'unknown_or_login',
    });

    const { getByText } = render(<LoginScreen onLoginSuccess={jest.fn()} />);
    expect(getByText('Login')).toBeTruthy();
  });
});
