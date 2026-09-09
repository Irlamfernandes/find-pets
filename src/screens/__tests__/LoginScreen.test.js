// src/screens/__tests__/LoginScreen.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LoginScreen from '../LoginScreen';
import { useLogin } from '../../hooks/useLogin';

// MOCK DO ASYNC STORAGE NECESSÁRIO PARA A ÁRVORE DE IMPORTAÇÃO
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

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

  // --- TELA 1: HOME ---
  it('deve renderizar a tela Home corretamente e navegar para Login ou Cadastro', () => {
    const { getByText } = render(<LoginScreen onLoginSuccess={jest.fn()} />);

    expect(getByText('FindPets')).toBeTruthy();
    expect(getByText('Escolha uma opção')).toBeTruthy();

    // Clica no botão Login
    fireEvent.press(getByText('Login'));
    expect(mockSetAuthMode).toHaveBeenCalledWith('login');

    // Clica no botão Cadastrar
    fireEvent.press(getByText('Cadastrar'));
    expect(mockSetAuthMode).toHaveBeenCalledWith('cadastro');
  });

  // --- TELA 2: CADASTRO ---
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

    const inputUsuario = getByPlaceholderText('Usuário');
    const inputSenha = getByPlaceholderText('Senha');

    fireEvent.changeText(inputUsuario, 'novo@test.com');
    fireEvent.changeText(inputSenha, '123456');

    expect(mockSetUsuario).toHaveBeenCalledWith('novo@test.com');
    expect(mockSetSenha).toHaveBeenCalledWith('123456');

    // Salvar e Cadastrar Biometria
    fireEvent.press(getByText('Salvar e Cadastrar Biometria'));
    expect(mockHandleRegister).toHaveBeenCalled();

    // Voltar para Home
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

  // --- TELA 3: LOGIN ---
  it('deve renderizar a tela de Login, campos, botões e biometria', () => {
    useLogin.mockReturnValue({
      ...baseHookValues,
      authMode: 'login',
    });

    const { getByText, getByPlaceholderText } = render(
      <LoginScreen onLoginSuccess={jest.fn()} />
    );

    expect(getByText('Login')).toBeTruthy();

    const inputUsuario = getByPlaceholderText('Usuário');
    const inputSenha = getByPlaceholderText('Senha');

    fireEvent.changeText(inputUsuario, 'user@test.com');
    fireEvent.changeText(inputSenha, '123456');

    expect(mockSetUsuario).toHaveBeenCalledWith('user@test.com');
    expect(mockSetSenha).toHaveBeenCalledWith('123456');

    // Entrar com Senha
    fireEvent.press(getByText('Entrar com Senha'));
    expect(mockHandleManualLogin).toHaveBeenCalled();

    // Entrar com Biometria
    fireEvent.press(getByText('Entrar com Biometria'));
    expect(mockTriggerBiometricAuth).toHaveBeenCalled();

    // Voltar para Home
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
