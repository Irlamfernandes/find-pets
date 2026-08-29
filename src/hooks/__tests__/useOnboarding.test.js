import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PropTypes from 'prop-types';
import { useOnboarding } from '../useOnboarding';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

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
  it('deve lidar com erro de campos vazios e sucesso ao salvar', async () => {
    const mockComplete = jest.fn();
    const { getByTestId } = render(<TestComponent onComplete={mockComplete} />);

    // Tenta salvar vazio
    fireEvent.press(getByTestId('save'));
    expect(getByTestId('error').props.children).toBe(
      'Preencha todos os campos.'
    );

    // Preenche os dados
    fireEvent.changeText(getByTestId('name'), 'Irlam');
    fireEvent.changeText(getByTestId('whatsapp'), '11999999999');

    // Salva com sucesso
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
    jest
      .spyOn(
        require('../../services/onboarding').onboardingService,
        'saveUserProfile'
      )
      .mockRejectedValueOnce(new Error('Erro de conexão ao salvar'));

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
    jest
      .spyOn(
        require('../../services/onboarding').onboardingService,
        'saveUserProfile'
      )
      .mockRejectedValueOnce(new Error());

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
