import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PropTypes from 'prop-types';
import { useOnboarding } from '../useOnboarding';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { onboardingService } from '../../services/onboarding';

// Mock do serviço
jest.mock('../../services/onboarding', () => ({
  onboardingService: {
    saveUserProfile: jest.fn().mockResolvedValue({ success: true }),
  },
}));

function TestComponent({ onComplete }) {
  const {
    name,
    setName,
    whatsapp,
    setWhatsapp,
    errorMessage,
    handleSaveProfile,
  } = useOnboarding(onComplete);
  return (
    <View>
      <Text testID="error">{errorMessage}</Text>
      <TextInput testID="name" value={name} onChangeText={setName} />
      <TextInput
        testID="whatsapp"
        value={whatsapp}
        onChangeText={setWhatsapp}
      />
      <TouchableOpacity testID="save" onPress={handleSaveProfile} />
    </View>
  );
}

TestComponent.propTypes = {
  onComplete: PropTypes.func,
};

describe('useOnboarding Hook (via Componente)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve lidar com erro de campos vazios ou preenchidos apenas com espaços', async () => {
    const { getByTestId } = render(<TestComponent />);

    fireEvent.press(getByTestId('save'));
    expect(getByTestId('error').props.children).toBe(
      'Preencha todos os campos.'
    );

    fireEvent.changeText(getByTestId('name'), '   ');
    fireEvent.changeText(getByTestId('whatsapp'), '   ');
    fireEvent.press(getByTestId('save'));
    expect(getByTestId('error').props.children).toBe(
      'Preencha todos os campos.'
    );
  });

  it('deve exibir erro se o número de WhatsApp for inválido (menos de 10 dígitos)', async () => {
    const { getByTestId } = render(<TestComponent />);

    fireEvent.changeText(getByTestId('name'), 'Irlam');
    fireEvent.changeText(getByTestId('whatsapp'), '119999999');
    fireEvent.press(getByTestId('save'));

    expect(getByTestId('error').props.children).toBe(
      'Insira um número de WhatsApp válido com DDD.'
    );
    expect(onboardingService.saveUserProfile).not.toHaveBeenCalled();
  });

  it('deve salvar com sucesso quando os dados forem válidos', async () => {
    const mockComplete = jest.fn();
    const { getByTestId } = render(<TestComponent onComplete={mockComplete} />);

    fireEvent.changeText(getByTestId('name'), 'Irlam');
    fireEvent.changeText(getByTestId('whatsapp'), '11999999999');

    fireEvent.press(getByTestId('save'));

    await waitFor(() => {
      expect(mockComplete).toHaveBeenCalledWith({
        name: 'Irlam',
        whatsapp: '11999999999',
      });
    });
  });

  it('deve executar sem quebrar se onComplete não for fornecido', async () => {
    const { getByTestId } = render(<TestComponent />);

    fireEvent.changeText(getByTestId('name'), 'Irlam');
    fireEvent.changeText(getByTestId('whatsapp'), '11999999999');

    fireEvent.press(getByTestId('save'));

    await waitFor(() => {
      expect(getByTestId('error').props.children).toBe('');
    });
  });

  it('deve capturar erro se o serviço de onboarding falhar com mensagem', async () => {
    onboardingService.saveUserProfile.mockRejectedValueOnce(
      new Error('Erro de conexão ao salvar')
    );

    const mockComplete = jest.fn();
    const { getByTestId } = render(<TestComponent onComplete={mockComplete} />);

    fireEvent.changeText(getByTestId('name'), 'Irlam');
    fireEvent.changeText(getByTestId('whatsapp'), '11999999999');

    fireEvent.press(getByTestId('save'));

    await waitFor(() => {
      expect(getByTestId('error').props.children).toBe(
        'Erro de conexão ao salvar'
      );
    });
  });

  it('deve capturar erro genérico se o serviço falhar sem mensagem', async () => {
    onboardingService.saveUserProfile.mockRejectedValueOnce({});

    const { getByTestId } = render(<TestComponent />);

    fireEvent.changeText(getByTestId('name'), 'Irlam');
    fireEvent.changeText(getByTestId('whatsapp'), '11999999999');

    fireEvent.press(getByTestId('save'));

    await waitFor(() => {
      expect(getByTestId('error').props.children).toBe(
        'Erro ao salvar perfil.'
      );
    });
  });
});
