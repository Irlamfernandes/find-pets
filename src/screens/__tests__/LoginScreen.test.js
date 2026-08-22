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
      hasBiometrics: true,
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
    const { getByTestId, getByText } = render(
      <LoginScreen onLoginSuccess={jest.fn()} />
    );

    fireEvent.press(getByTestId('button-login'));
    expect(getByText('Please fill in all fields')).toBeTruthy();
    expect(mockHandleManualLogin).not.toHaveBeenCalled();
  });

  it('deve chamar o handleManualLogin quando os campos estiverem preenchidos', () => {
    const { getByTestId } = render(<LoginScreen onLoginSuccess={jest.fn()} />);

    fireEvent.changeText(getByTestId('input-email'), 'teste@test.com');
    fireEvent.changeText(getByTestId('input-password'), '123456');

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
      hasBiometrics: false,
      handleManualLogin: mockHandleManualLogin,
      triggerBiometricAuth: mockTriggerBiometricAuth,
    });

    const { queryByTestId } = render(
      <LoginScreen onLoginSuccess={jest.fn()} />
    );
    expect(queryByTestId('button-biometrics')).toBeNull();
  });
});
