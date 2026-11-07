import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AuthHomeScreen } from '../AuthHomeScreen';

describe('AuthHomeScreen Component', () => {
  it('deve renderizar os elementos da tela home e disparar a navegação corretamente', () => {
    const mockOnNavigate = jest.fn();
    const { getByText } = render(
      <AuthHomeScreen onNavigate={mockOnNavigate} />
    );

    expect(getByText('FindPets')).toBeTruthy();
    expect(getByText('Escolha uma opção')).toBeTruthy();

    fireEvent.press(getByText('Login'));
    expect(mockOnNavigate).toHaveBeenCalledWith('login');

    fireEvent.press(getByText('Cadastrar'));
    expect(mockOnNavigate).toHaveBeenCalledWith('cadastro');
  });

  it('deve oferecer a entrada com biometria da conta dona e mostrar erros', () => {
    const onBiometricLogin = jest.fn();
    const { getByTestId, getByText } = render(
      <AuthHomeScreen
        onNavigate={jest.fn()}
        biometricOwner="irlam@gmail.com"
        onBiometricLogin={onBiometricLogin}
        errorMessage="Biometria não reconhecida."
      />
    );

    expect(getByText('ir***@gmail.com')).toBeTruthy();
    expect(getByText('Biometria não reconhecida.')).toBeTruthy();
    fireEvent.press(getByTestId('button-home-biometrics'));
    expect(onBiometricLogin).toHaveBeenCalledTimes(1);
  });

  it('não deve mostrar a biometria sem conta dona', () => {
    const { queryByTestId } = render(<AuthHomeScreen onNavigate={jest.fn()} />);

    expect(queryByTestId('button-home-biometrics')).toBeNull();
  });
});
