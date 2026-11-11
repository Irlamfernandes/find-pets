import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AuthHomeScreen } from '../AuthHomeScreen';

describe('AuthHomeScreen Component', () => {
  it('deve renderizar os elementos da tela home e disparar a navegação corretamente', async () => {
    const mockOnNavigate = jest.fn();
    const { getByText } = await render(
      <AuthHomeScreen onNavigate={mockOnNavigate} />
    );

    expect(getByText('FindPets')).toBeTruthy();
    expect(getByText('Escolha uma opção')).toBeTruthy();

    await fireEvent.press(getByText('Login'));
    expect(mockOnNavigate).toHaveBeenCalledWith('login');

    await fireEvent.press(getByText('Cadastrar'));
    expect(mockOnNavigate).toHaveBeenCalledWith('cadastro');
  });
});
