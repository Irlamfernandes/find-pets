import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import OnboardingScreen from '../OnboardingScreen';

describe('OnboardingScreen Component', () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar os títulos, inputs e botões corretamente e sem mensagem de erro inicial', () => {
    const { getByPlaceholderText, getByText, getByTestId, queryByText } =
      render(<OnboardingScreen onComplete={mockOnComplete} />);

    expect(getByText('Complete seu Perfil')).toBeTruthy();
    expect(getByPlaceholderText('Seu Nome')).toBeTruthy();
    expect(getByPlaceholderText('WhatsApp (com DDD)')).toBeTruthy();
    expect(getByTestId('button-complete')).toBeTruthy();

    expect(queryByText('Preencha todos os campos.')).toBeNull();
  });

  it('deve exibir mensagem de erro na tela se tentar salvar com campos vazios', async () => {
    const { getByTestId, getByText } = render(<OnboardingScreen />);

    fireEvent.press(getByTestId('button-complete'));

    await waitFor(() => {
      expect(getByText('Preencha todos os campos.')).toBeTruthy();
    });
  });

  it('deve interagir com os campos e disparar a conclusão', async () => {
    const { getByTestId } = render(
      <OnboardingScreen onComplete={mockOnComplete} />
    );

    fireEvent.changeText(getByTestId('input-name'), 'Irlam');
    fireEvent.changeText(getByTestId('input-whatsapp'), '11999999999');
    fireEvent.press(getByTestId('button-complete'));

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith({
        name: 'Irlam',
        whatsapp: '11999999999',
      });
    });
  });

  it('deve executar sem quebrar se onComplete não for passado para a tela', async () => {
    const { getByTestId } = render(<OnboardingScreen />);

    fireEvent.changeText(getByTestId('input-name'), 'Irlam');
    fireEvent.changeText(getByTestId('input-whatsapp'), '11999999999');
    fireEvent.press(getByTestId('button-complete'));

    await waitFor(() => {
      expect(getByTestId('button-complete')).toBeTruthy();
    });
  });
});
