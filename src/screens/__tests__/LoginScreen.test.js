import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LoginScreen from '../LoginScreen';
import { useLogin } from '../../hooks/useLogin';

jest.mock('../../hooks/useLogin');

describe('LoginScreen Component', () => {
  const mockHandleManualLogin = jest.fn();
  const mockTriggerBiometricAuth = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useLogin.mockReturnValue({
      email: '',
      setEmail: jest.fn(),
      password: '',
      setPassword: jest.fn(),
      hasBiometrics: true,
      errorMessage: '',
      handleManualLogin: mockHandleManualLogin,
      triggerBiometricAuth: mockTriggerBiometricAuth,
    });
  });

  it('deve renderizar os campos e botões corretamente', () => {
    const { getByPlaceholderText, getByTestId } = render(
      <LoginScreen onLoginSuccess={jest.fn()} />
    );

    expect(getByPlaceholderText('E-mail')).toBeTruthy();
    expect(getByPlaceholderText('Senha')).toBeTruthy();
    expect(getByTestId('button-login')).toBeTruthy();
    expect(getByTestId('button-biometrics')).toBeTruthy();
  });

  it('deve exibir mensagem de erro se tentar logar com campos vazios', () => {
    useLogin.mockReturnValue({
      email: '',
      setEmail: jest.fn(),
      password: '',
      setPassword: jest.fn(),
      hasBiometrics: true,
      errorMessage: 'Preencha e-mail e senha.',
      handleManualLogin: mockHandleManualLogin,
      triggerBiometricAuth: mockTriggerBiometricAuth,
    });

    const { getByTestId, getByText } = render(
      <LoginScreen onLoginSuccess={jest.fn()} />
    );

    fireEvent.press(getByTestId('button-login'));
    expect(getByText('Preencha e-mail e senha.')).toBeTruthy();
  });

  it('deve chamar o handleManualLogin quando o botão de entrar for pressionado', () => {
    const { getByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);

    fireEvent.press(getByTestId('button-login'));
    expect(mockHandleManualLogin).toHaveBeenCalled();
  });

  it('deve disparar o evento de biometria ao clicar no botão correspondente', () => {
    const { getByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);

    fireEvent.press(getByTestId('button-biometrics'));
    expect(mockTriggerBiometricAuth).toHaveBeenCalled();
  });

  it('não deve renderizar o botão de biometria se hasBiometrics for falso', () => {
    useLogin.mockReturnValue({
      email: '',
      setEmail: jest.fn(),
      password: '',
      setPassword: jest.fn(),
      hasBiometrics: false,
      errorMessage: '',
      handleManualLogin: mockHandleManualLogin,
      triggerBiometricAuth: mockTriggerBiometricAuth,
    });

    const { queryByTestId } = render(
      <LoginScreen onLoginSuccess={jest.fn()} />
    );
    expect(queryByTestId('button-biometrics')).toBeNull();
  });
});
