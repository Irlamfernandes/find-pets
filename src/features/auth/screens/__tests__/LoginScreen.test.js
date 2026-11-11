import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LoginScreen from '../LoginScreen';
import { useLogin } from '../../hooks/useLogin';

jest.mock('../../hooks/useLogin');

describe('LoginScreen Component', () => {
  const mockSetAuthMode = jest.fn();
  const mockNavigate = jest.fn();
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
    navigate: mockNavigate,
    handleRegister: mockHandleRegister,
    handleManualLogin: mockHandleManualLogin,
    triggerBiometricAuth: mockTriggerBiometricAuth,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useLogin.mockReturnValue(baseHookValues);
  });

  it('deve renderizar a tela Home corretamente e navegar para Login ou Cadastro', async () => {
    const { getByText } = await render(
      <LoginScreen onLoginSuccess={jest.fn()} />
    );

    expect(getByText('FindPets')).toBeTruthy();
    expect(getByText('Escolha uma opção')).toBeTruthy();

    await fireEvent.press(getByText('Login'));
    expect(mockNavigate).toHaveBeenCalledWith('login');

    await fireEvent.press(getByText('Cadastrar'));
    expect(mockNavigate).toHaveBeenCalledWith('cadastro');
  });

  it('deve renderizar a tela de Cadastro e disparar as ações corretamente', async () => {
    useLogin.mockReturnValue({
      ...baseHookValues,
      authMode: 'cadastro',
      errorMessage: 'Erro de teste',
    });

    const { getByText, getByPlaceholderText } = await render(
      <LoginScreen onLoginSuccess={jest.fn()} />
    );

    expect(getByText('Cadastro')).toBeTruthy();
    expect(getByText('Erro de teste')).toBeTruthy();

    const inputUsuario = getByPlaceholderText('E-mail');
    const inputSenha = getByPlaceholderText('Senha');

    await fireEvent.changeText(inputUsuario, 'novo@test.com');
    await fireEvent.changeText(inputSenha, '123456');

    expect(mockSetUsuario).toHaveBeenCalledWith('novo@test.com');
    expect(mockSetSenha).toHaveBeenCalledWith('123456');

    await fireEvent.press(getByText('Criar conta'));
    expect(mockHandleRegister).toHaveBeenCalled();

    await fireEvent.press(getByText('Voltar'));
    expect(mockSetAuthMode).toHaveBeenCalledWith('home');
  });

  it('não deve exibir mensagem de erro se errorMessage estiver vazio no Cadastro', async () => {
    useLogin.mockReturnValue({
      ...baseHookValues,
      authMode: 'cadastro',
      errorMessage: '',
    });

    const { queryByText } = await render(
      <LoginScreen onLoginSuccess={jest.fn()} />
    );
    expect(queryByText('Erro de teste')).toBeNull();
  });

  it('deve renderizar a tela de Login, campos, botões e biometria', async () => {
    useLogin.mockReturnValue({
      ...baseHookValues,
      authMode: 'login',
    });

    const { getByText, getByPlaceholderText } = await render(
      <LoginScreen onLoginSuccess={jest.fn()} />
    );

    expect(getByText('Login')).toBeTruthy();

    const inputUsuario = getByPlaceholderText('E-mail');
    const inputSenha = getByPlaceholderText('Senha');

    await fireEvent.changeText(inputUsuario, 'user@test.com');
    await fireEvent.changeText(inputSenha, '123456');

    expect(mockSetUsuario).toHaveBeenCalledWith('user@test.com');
    expect(mockSetSenha).toHaveBeenCalledWith('123456');

    await fireEvent.press(getByText('Entrar com Senha'));
    expect(mockHandleManualLogin).toHaveBeenCalled();

    await fireEvent.press(getByText('Entrar com Biometria'));
    expect(mockTriggerBiometricAuth).toHaveBeenCalled();

    await fireEvent.press(getByText('Voltar'));
    expect(mockSetAuthMode).toHaveBeenCalledWith('home');
  });

  it('não deve renderizar o botão de biometria se hasHardwareBiometric for falso', async () => {
    useLogin.mockReturnValue({
      ...baseHookValues,
      authMode: 'login',
      hasHardwareBiometric: false,
    });

    const { queryByText } = await render(
      <LoginScreen onLoginSuccess={jest.fn()} />
    );
    expect(queryByText('Entrar com Biometria')).toBeNull();
  });

  it('não deve exibir mensagem de erro se errorMessage estiver vazio no Login', async () => {
    useLogin.mockReturnValue({
      ...baseHookValues,
      authMode: 'login',
      errorMessage: '',
    });

    const { queryByText } = await render(
      <LoginScreen onLoginSuccess={jest.fn()} />
    );
    expect(queryByText('Erro crítico de login')).toBeNull();
  });

  it('deve exibir mensagem de erro se errorMessage estiver preenchido no Login', async () => {
    useLogin.mockReturnValue({
      ...baseHookValues,
      authMode: 'login',
      errorMessage: 'Erro crítico de login',
    });

    const { getByText } = await render(
      <LoginScreen onLoginSuccess={jest.fn()} />
    );
    expect(getByText('Erro crítico de login')).toBeTruthy();
  });

  it('deve renderizar a AuthLoginScreen por padrão quando authMode for diferente de home e cadastro', async () => {
    useLogin.mockReturnValue({
      ...baseHookValues,
      authMode: 'unknown_or_login',
    });

    const { getByText } = await render(
      <LoginScreen onLoginSuccess={jest.fn()} />
    );
    expect(getByText('Login')).toBeTruthy();
  });
});
