import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import OnboardingScreen from '../OnboardingScreen';
import { Platform, TextInput } from 'react-native';

jest.mock('../../services/profileService', () => ({
  profileService: { saveProfile: jest.fn().mockResolvedValue() },
}));

describe('OnboardingScreen Component', () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar os títulos, inputs e botões corretamente e sem mensagem de erro inicial', async () => {
    const { getByPlaceholderText, getByText, getByTestId, queryByText } =
      await render(<OnboardingScreen onComplete={mockOnComplete} />);

    expect(getByText('Complete seu Perfil')).toBeTruthy();
    expect(getByPlaceholderText('Seu Nome')).toBeTruthy();
    expect(getByPlaceholderText('WhatsApp: +55 (11) 99999-9999')).toBeTruthy();
    expect(getByTestId('button-complete')).toBeTruthy();

    expect(queryByText('Preencha todos os campos.')).toBeNull();
  });

  it('deve marcar nome e WhatsApp como obrigatórios', async () => {
    const { getByText, getAllByTestId } = await render(<OnboardingScreen />);

    expect(getByText('Nome *')).toBeTruthy();
    expect(getByText('WhatsApp *')).toBeTruthy();
    expect(getAllByTestId('required-mark')).toHaveLength(2);
  });

  it('deve exibir mensagem de erro na tela se tentar salvar com campos vazios', async () => {
    const { getByTestId, getByText } = await render(<OnboardingScreen />);

    await fireEvent.press(getByTestId('button-complete'));

    await waitFor(() => {
      expect(getByText('Preencha todos os campos.')).toBeTruthy();
    });
  });

  it('deve interagir com os campos e disparar a conclusão', async () => {
    const { getByTestId } = await render(
      <OnboardingScreen onComplete={mockOnComplete} />
    );

    await fireEvent.changeText(getByTestId('input-name'), 'Irlam');
    await fireEvent.changeText(getByTestId('input-whatsapp'), '5511999999999');
    await fireEvent.press(getByTestId('button-complete'));

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith({
        name: 'Irlam',
        whatsapp: '5511999999999',
      });
    });
  });

  it('deve salvar ao confirmar no teclado do campo WhatsApp', async () => {
    const { getByTestId } = await render(
      <OnboardingScreen onComplete={mockOnComplete} />
    );

    await fireEvent.changeText(getByTestId('input-name'), 'Irlam');
    await fireEvent.changeText(getByTestId('input-whatsapp'), '5511999999999');
    await fireEvent(getByTestId('input-whatsapp'), 'submitEditing');

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith({
        name: 'Irlam',
        whatsapp: '5511999999999',
      });
    });
  });

  it('deve executar sem quebrar se onComplete não for passado para a tela', async () => {
    const { getByTestId } = await render(<OnboardingScreen />);

    await fireEvent.changeText(getByTestId('input-name'), 'Irlam');
    await fireEvent.changeText(getByTestId('input-whatsapp'), '5511999999999');
    await fireEvent.press(getByTestId('button-complete'));

    await waitFor(() => {
      expect(getByTestId('button-complete')).toBeTruthy();
    });
  });

  it('deve renderizar corretamente no ambiente Android', async () => {
    const originalOS = Platform.OS;
    Platform.OS = 'android';

    const { getByTestId } = await render(
      <OnboardingScreen onComplete={mockOnComplete} />
    );
    expect(getByTestId('button-complete')).toBeTruthy();

    Platform.OS = originalOS;
  });

  it('deve ir para o campo de WhatsApp ao confirmar o nome no teclado', async () => {
    const focusSpy = jest.spyOn(TextInput.prototype, 'focus');
    const { getByTestId } = await render(<OnboardingScreen />);

    await fireEvent(getByTestId('input-name'), 'submitEditing');

    expect(focusSpy).toHaveBeenCalledTimes(1);
    focusSpy.mockRestore();
  });
});
