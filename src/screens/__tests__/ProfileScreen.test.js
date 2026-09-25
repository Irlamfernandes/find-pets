import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../ProfileScreen';
import { onboardingService } from '../../services/onboarding';
import { sessionService } from '../../services/session';
import { Alert } from 'react-native';

// Mock dos serviços
jest.mock('../../services/onboarding', () => ({
  onboardingService: {
    getUserProfile: jest.fn(),
    saveUserProfile: jest.fn(),
  },
}));

jest.mock('../../services/session', () => ({
  sessionService: {
    getCredentials: jest.fn(),
    saveCredentials: jest.fn(),
  },
}));

jest.spyOn(Alert, 'alert');

describe('ProfileScreen Component - 100% Coverage', () => {
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    onboardingService.getUserProfile.mockResolvedValue({
      name: 'Irlam',
      whatsapp: '11999999999',
    });
  });

  it('deve carregar e exibir os dados do usuário ao iniciar com sucesso', async () => {
    const { getByDisplayValue } = render(<ProfileScreen onBack={mockOnBack} />);

    await waitFor(() => {
      expect(getByDisplayValue('Irlam')).toBeTruthy();
      expect(getByDisplayValue('11999999999')).toBeTruthy();
    });
  });

  it('deve chamar onLogout ao clicar em Sair', () => {
    const mockOnLogout = jest.fn();
    const { getByText } = render(
      <ProfileScreen onBack={mockOnBack} onLogout={mockOnLogout} />
    );

    fireEvent.press(getByText('Sair'));
    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  });

  it('deve abrir a câmera ao clicar na aba Camera', () => {
    const mockOnOpenCamera = jest.fn();
    const { getByText } = render(
      <ProfileScreen onBack={mockOnBack} onOpenCamera={mockOnOpenCamera} />
    );

    fireEvent.press(getByText('Camera'));

    expect(mockOnOpenCamera).toHaveBeenCalledTimes(1);
    expect(mockOnBack).not.toHaveBeenCalled();
  });

  it('deve lidar com erro ao carregar os dados do perfil', async () => {
    onboardingService.getUserProfile.mockRejectedValueOnce(
      new Error('Erro perfil')
    );

    render(<ProfileScreen onBack={mockOnBack} />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erro',
        'Não foi possível carregar os dados do perfil.'
      );
    });
  });

  it('deve lidar com perfil vazio/nulo ao carregar', async () => {
    onboardingService.getUserProfile.mockResolvedValueOnce(null);

    const { getByPlaceholderText } = render(
      <ProfileScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(getByPlaceholderText('Seu nome').props.value).toBe('');
      expect(getByPlaceholderText('Seu WhatsApp').props.value).toBe('');
    });
  });

  it('deve exibir alerta se nome ou whatsapp estiverem vazios ao salvar', async () => {
    const { getByPlaceholderText, getByText } = render(
      <ProfileScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(getByPlaceholderText('Seu nome')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('Seu nome'), '   ');
    fireEvent.changeText(getByPlaceholderText('Seu WhatsApp'), '');
    fireEvent.press(getByText('Salvar Alterações'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Atenção',
      'Nome e WhatsApp não podem estar vazios.'
    );
  });

  it('deve exibir alerta se o telefone tiver menos de 10 dígitos', async () => {
    const { getByPlaceholderText, getByText } = render(
      <ProfileScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(getByPlaceholderText('Seu nome')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('Seu nome'), 'Irlam');
    fireEvent.changeText(getByPlaceholderText('Seu WhatsApp'), '11999');
    fireEvent.press(getByText('Salvar Alterações'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Atenção',
      'Insira um número de WhatsApp válido com DDD.'
    );
  });

  it('deve salvar o perfil com sucesso sem alterar a senha', async () => {
    onboardingService.saveUserProfile.mockResolvedValueOnce();

    const { getByPlaceholderText, getByText } = render(
      <ProfileScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(getByPlaceholderText('Seu nome')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('Seu nome'), 'Irlam Silva');
    fireEvent.changeText(
      getByPlaceholderText('Seu WhatsApp'),
      '(11) 98888-7777'
    );
    fireEvent.press(getByText('Salvar Alterações'));

    await waitFor(() => {
      expect(onboardingService.saveUserProfile).toHaveBeenCalledWith({
        name: 'Irlam Silva',
        whatsapp: '11988887777',
      });
      expect(Alert.alert).toHaveBeenCalledWith(
        'Sucesso',
        'Perfil atualizado com sucesso!'
      );
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  it('deve salvar o perfil e atualizar a senha quando informada e houver credenciais', async () => {
    onboardingService.saveUserProfile.mockResolvedValueOnce();
    sessionService.getCredentials.mockResolvedValueOnce({
      usuario: 'irlam@test.com',
      hasBiometrics: true,
    });
    sessionService.saveCredentials.mockResolvedValueOnce();

    const { getByPlaceholderText, getByText } = render(
      <ProfileScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(getByPlaceholderText('Seu nome')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('Seu nome'), 'Irlam');
    fireEvent.changeText(getByPlaceholderText('Seu WhatsApp'), '11999999999');
    fireEvent.changeText(
      getByPlaceholderText('Digite uma nova senha se desejar alterar'),
      'newpass123'
    );
    fireEvent.press(getByText('Salvar Alterações'));

    await waitFor(() => {
      expect(sessionService.saveCredentials).toHaveBeenCalledWith(
        'irlam@test.com',
        'newpass123',
        true
      );
      expect(Alert.alert).toHaveBeenCalledWith(
        'Sucesso',
        'Perfil atualizado com sucesso!'
      );
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  it('deve salvar o perfil informando nova senha, mas sem credenciais pré-existentes', async () => {
    onboardingService.saveUserProfile.mockResolvedValueOnce();
    sessionService.getCredentials.mockResolvedValueOnce(null);

    const { getByPlaceholderText, getByText } = render(
      <ProfileScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(getByPlaceholderText('Seu nome')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('Seu nome'), 'Irlam');
    fireEvent.changeText(getByPlaceholderText('Seu WhatsApp'), '11999999999');
    fireEvent.changeText(
      getByPlaceholderText('Digite uma nova senha se desejar alterar'),
      'newpass123'
    );
    fireEvent.press(getByText('Salvar Alterações'));

    await waitFor(() => {
      expect(sessionService.saveCredentials).not.toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Sucesso',
        'Perfil atualizado com sucesso!'
      );
    });
  });

  it('deve lidar com erro ao salvar as alterações', async () => {
    onboardingService.saveUserProfile.mockRejectedValueOnce(
      new Error('Falha ao salvar')
    );

    const { getByPlaceholderText, getByText } = render(
      <ProfileScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(getByPlaceholderText('Seu nome')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('Seu nome'), 'Irlam');
    fireEvent.changeText(getByPlaceholderText('Seu WhatsApp'), '11999999999');
    fireEvent.press(getByText('Salvar Alterações'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erro',
        'Não foi possível salvar as alterações: Falha ao salvar'
      );
    });
  });

  it('deve lidar com perfil contendo propriedades vazias ou nulas individualmente', async () => {
    onboardingService.getUserProfile.mockResolvedValueOnce({
      name: null,
      whatsapp: undefined,
    });

    const { getByPlaceholderText } = render(
      <ProfileScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(getByPlaceholderText('Seu nome').props.value).toBe('');
      expect(getByPlaceholderText('Seu WhatsApp').props.value).toBe('');
    });
  });

  it('não deve salvar nova senha se as credenciais recuperadas não possuírem a propriedade usuario', async () => {
    onboardingService.saveUserProfile.mockResolvedValueOnce();
    sessionService.getCredentials.mockResolvedValueOnce({
      hasBiometrics: true,
    });

    const { getByPlaceholderText, getByText } = render(
      <ProfileScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(getByPlaceholderText('Seu nome')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('Seu nome'), 'Irlam');
    fireEvent.changeText(getByPlaceholderText('Seu WhatsApp'), '11999999999');
    fireEvent.changeText(
      getByPlaceholderText('Digite uma nova senha se desejar alterar'),
      'newpass123'
    );
    fireEvent.press(getByText('Salvar Alterações'));

    await waitFor(() => {
      expect(sessionService.saveCredentials).not.toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Sucesso',
        'Perfil atualizado com sucesso!'
      );
    });
  });

  it('deve salvar as alterações com sucesso mesmo quando a prop onBack não é fornecida', async () => {
    onboardingService.saveUserProfile.mockResolvedValueOnce();

    const { getByPlaceholderText, getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByPlaceholderText('Seu nome')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('Seu nome'), 'Irlam');
    fireEvent.changeText(getByPlaceholderText('Seu WhatsApp'), '11999999999');
    fireEvent.press(getByText('Salvar Alterações'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Sucesso',
        'Perfil atualizado com sucesso!'
      );
    });
  });
});
