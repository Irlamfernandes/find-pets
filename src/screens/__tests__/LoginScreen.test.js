import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LoginScreen from '../LoginScreen';
import { useLogin } from '../../hooks/useLogin';

jest.mock('../../hooks/useLogin');

describe('LoginScreen Component', () => {
  const mockSetEmail = jest.fn();
  const mockSetPassword = jest.fn();
  const mockHandleManualLogin = jest.fn();
  const mockTriggerBiometricAuth = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useLogin.mockReturnValue({
      email: '',
      setEmail: mockSetEmail,
      password: '',
      setPassword: mockSetPassword,
      hasBiometrics: true,
      errorMessage: '',
      handleManualLogin: mockHandleManualLogin,
      triggerBiometricAuth: mockTriggerBiometricAuth,
    });
  });

  it('deve renderizar os campos e botões corretamente', () => {
    const { getByPlaceholderText, getByTestId } = render(<LoginScreen />);

    expect(getByPlaceholderText('E-mail')).toBeTruthy();
    expect(getByPlaceholderText('Senha')).toBeTruthy();
    expect(getByTestId('button-login')).toBeTruthy();
    expect(getByTestId('button-biometrics')).toBeTruthy();
  });

  it('deve exibir a mensagem de erro quando informada pelo hook', () => {
    useLogin.mockReturnValueOnce({
      email: '',
      setEmail: mockSetEmail,
      password: '',
      setPassword: mockSetPassword,
      hasBiometrics: false,
      errorMessage: 'Preencha e-mail e senha.',
      handleManualLogin: mockHandleManualLogin,
      triggerBiometricAuth: mockTriggerBiometricAuth,
    });

    const { getByText } = render(<LoginScreen />);
    expect(getByText('Preencha e-mail e senha.')).toBeTruthy();
  });

  it('deve disparar os eventos de digitação e clique', () => {
    const { getByTestId } = render(<LoginScreen />);

    fireEvent.changeText(getByTestId('input-email'), 'teste@test.com');
    expect(mockSetEmail).toHaveBeenCalledWith('teste@test.com');

    fireEvent.changeText(getByTestId('input-password'), '123456');
    expect(mockSetPassword).toHaveBeenCalledWith('123456');

    fireEvent.press(getByTestId('button-login'));
    expect(mockHandleManualLogin).toHaveBeenCalled();

    fireEvent.press(getByTestId('button-biometrics'));
    expect(mockTriggerBiometricAuth).toHaveBeenCalled();
  });
});
