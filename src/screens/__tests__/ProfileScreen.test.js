import React from 'react';
import {
  render,
  fireEvent,
  waitFor,
  screen,
  act,
} from '@testing-library/react-native';
import ProfileScreen from '../ProfileScreen';
import { onboardingService } from '../../services/onboarding';
import { sessionService } from '../../services/session';
import { photoService } from '../../services/photoService';
import { profilePhotoStorage } from '../../services/profilePhotoStorage';
import { Alert, TextInput, BackHandler } from 'react-native';
import { useKeyboardVisible } from '../../hooks/useKeyboardVisible';

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
    getSession: jest.fn(),
    verifyPassword: jest.fn(),
  },
}));

jest.mock('../../services/photoService', () => ({
  photoService: { pickProfilePhoto: jest.fn() },
}));

jest.mock('../../services/profilePhotoStorage', () => ({
  profilePhotoStorage: {
    persist: jest.fn(async (uri) =>
      uri && !uri.startsWith('stored:') ? `stored:${uri}` : uri
    ),
    remove: jest.fn(),
  },
}));

jest.mock('../../components/BiometricSettingsCard', () => ({
  BiometricSettingsCard: () => null,
}));

jest.mock('../../hooks/useKeyboardVisible', () => ({
  useKeyboardVisible: jest.fn(() => false),
}));

jest.spyOn(Alert, 'alert');

// Desbloqueia os campos do perfil confirmando a senha atual
async function unlockEditing(password = 'senha123') {
  fireEvent.press(screen.getByTestId('button-edit-profile'));
  fireEvent.changeText(screen.getByTestId('input-current-password'), password);
  fireEvent.press(screen.getByText('Confirmar'));
  await waitFor(() => {
    expect(screen.getByText('Salvar Alterações')).toBeTruthy();
  });
}

const pressHardwareBack = () => {
  const [, listener] = BackHandler.addEventListener.mock.calls.at(-1);
  return listener();
};

describe('ProfileScreen Component - 100% Coverage', () => {
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    onboardingService.getUserProfile.mockResolvedValue({
      name: 'Irlam',
      whatsapp: '11999999999',
    });
    sessionService.getSession.mockResolvedValue({ usuario: 'irlam@test.com' });
    sessionService.getCredentials.mockResolvedValue({
      usuario: 'irlam@test.com',
      passwordHash: 'hash',
    });
    sessionService.verifyPassword.mockResolvedValue(true);
  });

  it('deve carregar e exibir os dados do usuário ao iniciar com sucesso', async () => {
    const { getByDisplayValue } = render(<ProfileScreen onBack={mockOnBack} />);

    await waitFor(() => {
      expect(getByDisplayValue('Irlam')).toBeTruthy();
      expect(getByDisplayValue('+55 (11) 99999-9999')).toBeTruthy();
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

  it('deve abrir o registro de desaparecimento pela aba', () => {
    const mockOnOpenReport = jest.fn();
    const { getByText } = render(
      <ProfileScreen onBack={mockOnBack} onOpenReport={mockOnOpenReport} />
    );

    fireEvent.press(getByText('Registrar desaparecimento'));

    expect(mockOnOpenReport).toHaveBeenCalledTimes(1);
    expect(mockOnBack).not.toHaveBeenCalled();
  });

  it('deve lidar com erro ao carregar os dados do perfil', async () => {
    onboardingService.getUserProfile.mockRejectedValueOnce(
      new Error('Erro perfil')
    );

    render(<ProfileScreen onBack={mockOnBack} />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Perfil indisponível',
        'Não foi possível carregar seus dados agora.'
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

    await unlockEditing();

    fireEvent.changeText(getByPlaceholderText('Seu nome'), '   ');
    fireEvent.changeText(getByPlaceholderText('Seu WhatsApp'), '');
    fireEvent.press(getByText('Salvar Alterações'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Confira seus dados',
      'Nome e WhatsApp precisam ser preenchidos.'
    );
  });

  it('deve exibir alerta se o telefone tiver menos de 12 dígitos', async () => {
    const { getByPlaceholderText, getByText } = render(
      <ProfileScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(getByPlaceholderText('Seu nome')).toBeTruthy();
    });

    await unlockEditing();

    fireEvent.changeText(getByPlaceholderText('Seu nome'), 'Irlam');
    fireEvent.changeText(getByPlaceholderText('Seu WhatsApp'), '5511999');
    fireEvent.press(getByText('Salvar Alterações'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'WhatsApp inválido',
      'Informe um número válido com código do país e DDD.'
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

    await unlockEditing();

    fireEvent.changeText(getByPlaceholderText('Seu nome'), 'Irlam Silva');
    fireEvent.changeText(
      getByPlaceholderText('Seu WhatsApp'),
      '+55 (11) 98888-7777'
    );
    fireEvent.press(getByText('Salvar Alterações'));

    await waitFor(() => {
      expect(onboardingService.saveUserProfile).toHaveBeenCalledWith({
        name: 'Irlam Silva',
        whatsapp: '5511988887777',
      });
      expect(Alert.alert).toHaveBeenCalledWith(
        'Perfil atualizado',
        'Suas informações foram salvas com sucesso.'
      );
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  it('deve salvar o perfil e atualizar a senha quando informada e houver credenciais', async () => {
    onboardingService.saveUserProfile.mockResolvedValueOnce();
    sessionService.getCredentials
      .mockResolvedValueOnce({ passwordHash: 'hash' })
      .mockResolvedValueOnce({
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

    await unlockEditing();

    fireEvent.changeText(getByPlaceholderText('Seu nome'), 'Irlam');
    fireEvent.changeText(getByPlaceholderText('Seu WhatsApp'), '5511999999999');
    fireEvent.changeText(
      getByPlaceholderText('Digite uma nova senha se desejar alterar'),
      'newpass123'
    );
    fireEvent.changeText(
      getByPlaceholderText('Digite a nova senha novamente'),
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
        'Perfil atualizado',
        'Suas informações foram salvas com sucesso.'
      );
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  it('deve salvar o perfil informando nova senha, mas sem credenciais pré-existentes', async () => {
    onboardingService.saveUserProfile.mockResolvedValueOnce();
    sessionService.getCredentials
      .mockResolvedValueOnce({ passwordHash: 'hash' })
      .mockResolvedValueOnce(null);

    const { getByPlaceholderText, getByText } = render(
      <ProfileScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(getByPlaceholderText('Seu nome')).toBeTruthy();
    });

    await unlockEditing();

    fireEvent.changeText(getByPlaceholderText('Seu nome'), 'Irlam');
    fireEvent.changeText(getByPlaceholderText('Seu WhatsApp'), '5511999999999');
    fireEvent.changeText(
      getByPlaceholderText('Digite uma nova senha se desejar alterar'),
      'newpass123'
    );
    fireEvent.changeText(
      getByPlaceholderText('Digite a nova senha novamente'),
      'newpass123'
    );
    fireEvent.press(getByText('Salvar Alterações'));

    await waitFor(() => {
      expect(sessionService.saveCredentials).not.toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Perfil atualizado',
        'Suas informações foram salvas com sucesso.'
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

    await unlockEditing();

    fireEvent.changeText(getByPlaceholderText('Seu nome'), 'Irlam');
    fireEvent.changeText(getByPlaceholderText('Seu WhatsApp'), '5511999999999');
    fireEvent.press(getByText('Salvar Alterações'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Não foi possível salvar',
        'Tente novamente. Falha ao salvar'
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
    sessionService.getCredentials
      .mockResolvedValueOnce({ passwordHash: 'hash' })
      .mockResolvedValueOnce({
        hasBiometrics: true,
      });

    const { getByPlaceholderText, getByText } = render(
      <ProfileScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(getByPlaceholderText('Seu nome')).toBeTruthy();
    });

    await unlockEditing();

    fireEvent.changeText(getByPlaceholderText('Seu nome'), 'Irlam');
    fireEvent.changeText(getByPlaceholderText('Seu WhatsApp'), '5511999999999');
    fireEvent.changeText(
      getByPlaceholderText('Digite uma nova senha se desejar alterar'),
      'newpass123'
    );
    fireEvent.changeText(
      getByPlaceholderText('Digite a nova senha novamente'),
      'newpass123'
    );
    fireEvent.press(getByText('Salvar Alterações'));

    await waitFor(() => {
      expect(sessionService.saveCredentials).not.toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Perfil atualizado',
        'Suas informações foram salvas com sucesso.'
      );
    });
  });

  it('deve salvar as alterações com sucesso mesmo quando a prop onBack não é fornecida', async () => {
    onboardingService.saveUserProfile.mockResolvedValueOnce();

    const { getByPlaceholderText, getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByPlaceholderText('Seu nome')).toBeTruthy();
    });

    await unlockEditing();

    fireEvent.changeText(getByPlaceholderText('Seu nome'), 'Irlam');
    fireEvent.changeText(getByPlaceholderText('Seu WhatsApp'), '5511999999999');
    fireEvent.press(getByText('Salvar Alterações'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Perfil atualizado',
        'Suas informações foram salvas com sucesso.'
      );
    });
  });

  it('deve salvar ao confirmar no teclado da nova senha', async () => {
    onboardingService.saveUserProfile.mockResolvedValueOnce();

    const { getByPlaceholderText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByPlaceholderText('Seu nome')).toBeTruthy();
    });

    await unlockEditing();

    fireEvent.changeText(getByPlaceholderText('Seu nome'), 'Irlam');
    fireEvent.changeText(getByPlaceholderText('Seu WhatsApp'), '5511999999999');
    fireEvent(
      getByPlaceholderText('Digite uma nova senha se desejar alterar'),
      'submitEditing'
    );

    await waitFor(() => {
      expect(onboardingService.saveUserProfile).toHaveBeenCalledWith({
        name: 'Irlam',
        whatsapp: '5511999999999',
      });
    });
  });

  it('deve exibir os campos travados por padrão', async () => {
    const { getByPlaceholderText, queryByText, queryByPlaceholderText } =
      render(<ProfileScreen onBack={mockOnBack} />);

    await waitFor(() => {
      expect(getByPlaceholderText('Seu nome').props.value).toBe('Irlam');
    });

    expect(getByPlaceholderText('Seu nome').props.editable).toBe(false);
    expect(getByPlaceholderText('Seu WhatsApp').props.editable).toBe(false);
    expect(queryByText('Salvar Alterações')).toBeNull();
    expect(
      queryByPlaceholderText('Digite uma nova senha se desejar alterar')
    ).toBeNull();
  });

  it('deve liberar a edição após confirmar a senha atual correta', async () => {
    const { getByPlaceholderText } = render(
      <ProfileScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(getByPlaceholderText('Seu nome').props.value).toBe('Irlam');
    });

    await unlockEditing('minhaSenha');

    expect(sessionService.getCredentials).toHaveBeenCalledWith(
      'irlam@test.com'
    );
    expect(sessionService.verifyPassword).toHaveBeenCalledWith(
      'minhaSenha',
      'hash'
    );
    expect(getByPlaceholderText('Seu nome').props.editable).toBe(true);
    expect(getByPlaceholderText('Seu WhatsApp').props.editable).toBe(true);
    expect(screen.queryByTestId('button-edit-profile')).toBeNull();
  });

  it('deve manter os campos travados se a senha atual estiver incorreta', async () => {
    sessionService.verifyPassword.mockResolvedValueOnce(false);
    const { getByPlaceholderText, getByTestId, getByText, queryByText } =
      render(<ProfileScreen onBack={mockOnBack} />);

    await waitFor(() => {
      expect(getByPlaceholderText('Seu nome').props.value).toBe('Irlam');
    });

    fireEvent.press(getByTestId('button-edit-profile'));
    fireEvent.changeText(getByTestId('input-current-password'), 'errada');
    fireEvent.press(getByText('Confirmar'));

    await waitFor(() => {
      expect(getByText('Senha incorreta. Tente novamente.')).toBeTruthy();
    });
    expect(getByPlaceholderText('Seu nome').props.editable).toBe(false);
    expect(queryByText('Salvar Alterações')).toBeNull();
  });

  it('deve pedir a senha se o campo de senha atual estiver vazio', async () => {
    const { getByTestId, getByText } = render(
      <ProfileScreen onBack={mockOnBack} />
    );

    fireEvent.press(getByTestId('button-edit-profile'));
    fireEvent(getByTestId('input-current-password'), 'submitEditing');

    await waitFor(() => {
      expect(getByText('Digite sua senha atual.')).toBeTruthy();
    });
    expect(sessionService.verifyPassword).not.toHaveBeenCalled();
  });

  it('deve exibir erro se não for possível verificar a senha', async () => {
    sessionService.getSession.mockRejectedValueOnce(new Error('falha'));
    const { getByTestId, getByText } = render(
      <ProfileScreen onBack={mockOnBack} />
    );

    fireEvent.press(getByTestId('button-edit-profile'));
    fireEvent.changeText(getByTestId('input-current-password'), 'senha123');
    fireEvent.press(getByText('Confirmar'));

    await waitFor(() => {
      expect(
        getByText('Não foi possível verificar a senha agora.')
      ).toBeTruthy();
    });
  });

  it('deve fechar o pedido de senha ao cancelar', async () => {
    const { getByTestId, getByText, queryByText } = render(
      <ProfileScreen onBack={mockOnBack} />
    );

    fireEvent.press(getByTestId('button-edit-profile'));
    expect(getByText('Editar perfil')).toBeTruthy();

    fireEvent.press(getByText('Cancelar'));

    await waitFor(() => {
      expect(queryByText('Editar perfil')).toBeNull();
    });
    expect(queryByText('Salvar Alterações')).toBeNull();
  });

  it('deve descartar as alterações e travar os campos ao cancelar a edição', async () => {
    const { getByPlaceholderText, getByText } = render(
      <ProfileScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(getByPlaceholderText('Seu nome').props.value).toBe('Irlam');
    });

    await unlockEditing();

    fireEvent.changeText(getByPlaceholderText('Seu nome'), 'Outro Nome');
    fireEvent.changeText(getByPlaceholderText('Seu WhatsApp'), '5521988887777');
    expect(getByPlaceholderText('Seu WhatsApp').props.value).toBe(
      '+55 (21) 98888-7777'
    );

    fireEvent.press(getByText('Cancelar'));

    expect(getByPlaceholderText('Seu nome').props.value).toBe('Irlam');
    expect(getByPlaceholderText('Seu WhatsApp').props.value).toBe(
      '+55 (11) 99999-9999'
    );
    expect(getByPlaceholderText('Seu nome').props.editable).toBe(false);
    expect(onboardingService.saveUserProfile).not.toHaveBeenCalled();
  });

  it('deve alternar a visibilidade da nova senha', async () => {
    const { getByPlaceholderText, getByTestId, getByLabelText, getByText } =
      render(<ProfileScreen onBack={mockOnBack} />);

    await waitFor(() => {
      expect(getByPlaceholderText('Seu nome').props.value).toBe('Irlam');
    });

    await unlockEditing();

    const newPasswordInput = () =>
      getByPlaceholderText('Digite uma nova senha se desejar alterar');
    expect(newPasswordInput().props.secureTextEntry).toBe(true);

    fireEvent.press(getByLabelText('Mostrar senha'));
    expect(newPasswordInput().props.secureTextEntry).toBe(false);

    fireEvent.press(getByLabelText('Ocultar senha'));
    expect(newPasswordInput().props.secureTextEntry).toBe(true);

    // Ao cancelar e editar novamente, a senha volta a ficar oculta
    fireEvent.press(getByTestId('button-toggle-password-visibility'));
    fireEvent.press(getByText('Cancelar'));
    await unlockEditing();
    expect(newPasswordInput().props.secureTextEntry).toBe(true);
  });

  it('deve avançar do nome para o WhatsApp e para a nova senha pelo teclado', async () => {
    const focusSpy = jest.spyOn(TextInput.prototype, 'focus');
    const { getByPlaceholderText } = render(
      <ProfileScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(getByPlaceholderText('Seu nome').props.value).toBe('Irlam');
    });
    await unlockEditing();

    fireEvent(getByPlaceholderText('Seu nome'), 'submitEditing');
    fireEvent(getByPlaceholderText('Seu WhatsApp'), 'submitEditing');

    expect(focusSpy).toHaveBeenCalledTimes(2);
    focusSpy.mockRestore();
  });

  it('deve esconder a barra inferior enquanto o teclado estiver aberto', async () => {
    useKeyboardVisible.mockReturnValue(true);
    const { queryByText, getByPlaceholderText } = render(
      <ProfileScreen onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(getByPlaceholderText('Seu nome').props.value).toBe('Irlam');
    });
    expect(queryByText('Pets perdidos')).toBeNull();

    useKeyboardVisible.mockReturnValue(false);
  });

  it('deve executar a seta de voltar ao usar o voltar do Android', () => {
    jest.spyOn(BackHandler, 'addEventListener');
    render(<ProfileScreen onBack={mockOnBack} />);

    expect(pressHardwareBack()).toBe(true);
    expect(mockOnBack).toHaveBeenCalledTimes(1);
    BackHandler.addEventListener.mockRestore();
  });

  describe('foto do perfil', () => {
    const renderLoaded = async (profile) => {
      if (profile)
        onboardingService.getUserProfile.mockResolvedValueOnce(profile);
      const utils = render(<ProfileScreen onBack={mockOnBack} />);
      await waitFor(() => {
        expect(utils.getByPlaceholderText('Seu nome').props.value).toBe(
          'Irlam'
        );
      });
      return utils;
    };

    it('deve exibir a foto e abrir em tela cheia sem precisar editar', async () => {
      const { getByLabelText, queryByTestId, getByTestId } = await renderLoaded(
        {
          name: 'Irlam',
          whatsapp: '5511999999999',
          photoUri: 'stored:perfil.jpg',
        }
      );

      expect(getByTestId('user-avatar-image').props.source).toEqual({
        uri: 'stored:perfil.jpg',
      });
      expect(queryByTestId('button-change-photo')).toBeNull();

      fireEvent.press(getByLabelText('Ver foto do perfil em tela cheia'));
      expect(getByTestId('photo-viewer-image').props.source).toEqual({
        uri: 'stored:perfil.jpg',
      });

      fireEvent.press(getByTestId('button-close-photo-viewer'));
      expect(queryByTestId('photo-viewer-image')).toBeNull();
    });

    it('não deve abrir tela cheia sem foto', async () => {
      const { getByTestId, queryByLabelText } = await renderLoaded();

      expect(getByTestId('user-avatar-placeholder')).toBeTruthy();
      expect(queryByLabelText('Ver foto do perfil em tela cheia')).toBeNull();
    });

    it('deve trocar a foto pela câmera ao editar e salvar na pasta permanente', async () => {
      onboardingService.saveUserProfile.mockResolvedValueOnce();
      photoService.pickProfilePhoto.mockResolvedValueOnce({
        uri: 'cache:nova.jpg',
        denied: false,
      });
      const { getByTestId, getByText, queryByText } = await renderLoaded({
        name: 'Irlam',
        whatsapp: '5511999999999',
        photoUri: 'stored:antiga.jpg',
      });

      await unlockEditing();
      fireEvent.press(getByTestId('button-change-photo'));
      expect(getByText('Remover foto')).toBeTruthy();
      await act(async () => {
        fireEvent.press(getByText('Tirar foto'));
      });
      expect(photoService.pickProfilePhoto).toHaveBeenCalledWith('camera');
      expect(queryByText('Remover foto')).toBeNull();

      await act(async () => {
        fireEvent.press(getByText('Salvar Alterações'));
      });

      expect(profilePhotoStorage.persist).toHaveBeenCalledWith(
        'cache:nova.jpg'
      );
      expect(onboardingService.saveUserProfile).toHaveBeenCalledWith({
        name: 'Irlam',
        whatsapp: '5511999999999',
        photoUri: 'stored:cache:nova.jpg',
      });
      expect(profilePhotoStorage.remove).toHaveBeenCalledWith(
        'stored:antiga.jpg'
      );
    });

    it('deve remover a foto e salvar o perfil sem ela', async () => {
      onboardingService.saveUserProfile.mockResolvedValueOnce();
      const { getByTestId, getByText } = await renderLoaded({
        name: 'Irlam',
        whatsapp: '5511999999999',
        photoUri: 'stored:antiga.jpg',
      });

      await unlockEditing();
      fireEvent.press(getByTestId('button-change-photo'));
      fireEvent.press(getByText('Remover foto'));
      expect(getByTestId('user-avatar-placeholder')).toBeTruthy();

      await act(async () => {
        fireEvent.press(getByText('Salvar Alterações'));
      });

      expect(onboardingService.saveUserProfile).toHaveBeenCalledWith({
        name: 'Irlam',
        whatsapp: '5511999999999',
      });
      expect(profilePhotoStorage.remove).toHaveBeenCalledWith(
        'stored:antiga.jpg'
      );
    });

    it('deve manter a foto salva sem apagar o arquivo quando não mudar', async () => {
      onboardingService.saveUserProfile.mockResolvedValueOnce();
      const { getByText } = await renderLoaded({
        name: 'Irlam',
        whatsapp: '5511999999999',
        photoUri: 'stored:antiga.jpg',
      });

      await unlockEditing();
      await act(async () => {
        fireEvent.press(getByText('Salvar Alterações'));
      });

      expect(onboardingService.saveUserProfile).toHaveBeenCalledWith(
        expect.objectContaining({ photoUri: 'stored:antiga.jpg' })
      );
      expect(profilePhotoStorage.remove).not.toHaveBeenCalled();
    });

    it('deve restaurar a foto original ao cancelar a edição', async () => {
      photoService.pickProfilePhoto.mockResolvedValueOnce({
        uri: 'cache:nova.jpg',
        denied: false,
      });
      const { getByTestId, getByText } = await renderLoaded({
        name: 'Irlam',
        whatsapp: '5511999999999',
        photoUri: 'stored:antiga.jpg',
      });

      await unlockEditing();
      fireEvent.press(getByTestId('button-change-photo'));
      await act(async () => {
        fireEvent.press(getByText('Escolher da galeria'));
      });
      expect(photoService.pickProfilePhoto).toHaveBeenCalledWith('gallery');
      expect(getByTestId('user-avatar-image').props.source).toEqual({
        uri: 'cache:nova.jpg',
      });

      fireEvent.press(getByText('Cancelar'));
      expect(getByTestId('user-avatar-image').props.source).toEqual({
        uri: 'stored:antiga.jpg',
      });
    });

    it('deve avisar sobre permissão negada, cancelamento e erros ao trocar a foto', async () => {
      const { getByTestId, getByText } = await renderLoaded();
      await unlockEditing();

      const pick = async (label, result) => {
        if (result instanceof Error) {
          photoService.pickProfilePhoto.mockRejectedValueOnce(result);
        } else {
          photoService.pickProfilePhoto.mockResolvedValueOnce(result);
        }
        fireEvent.press(getByTestId('button-change-photo'));
        await act(async () => {
          fireEvent.press(getByText(label));
        });
      };

      await pick('Tirar foto', { uri: null, denied: true });
      expect(Alert.alert).toHaveBeenCalledWith(
        'Permissão necessária',
        'Permita o acesso à câmera para tirar sua foto.'
      );

      await pick('Escolher da galeria', { uri: null, denied: true });
      expect(Alert.alert).toHaveBeenCalledWith(
        'Permissão necessária',
        'Permita o acesso às fotos para escolher sua foto.'
      );

      await pick('Escolher da galeria', { uri: null, denied: false });
      expect(getByTestId('user-avatar-placeholder')).toBeTruthy();

      await pick('Tirar foto', new Error('falha'));
      expect(Alert.alert).toHaveBeenCalledWith(
        'Não foi possível trocar a foto',
        'Tente novamente em alguns instantes.'
      );
    });
  });

  describe('confirmação da nova senha', () => {
    const NEW = 'Digite uma nova senha se desejar alterar';
    const CONFIRM = 'Digite a nova senha novamente';

    const renderUnlocked = async () => {
      const utils = render(<ProfileScreen onBack={mockOnBack} />);
      await waitFor(() => {
        expect(utils.getByPlaceholderText('Seu nome').props.value).toBe(
          'Irlam'
        );
      });
      await unlockEditing();
      return utils;
    };

    it('deve exibir a confirmação só depois de digitar a nova senha', async () => {
      const { getByPlaceholderText, queryByPlaceholderText } =
        await renderUnlocked();

      expect(queryByPlaceholderText(CONFIRM)).toBeNull();
      fireEvent.changeText(getByPlaceholderText(NEW), 'a');
      expect(getByPlaceholderText(CONFIRM)).toBeTruthy();
      expect(getByPlaceholderText(CONFIRM).props.secureTextEntry).toBe(true);

      // Mostrar a senha vale para os dois campos
      fireEvent.press(screen.getByLabelText('Mostrar senha'));
      expect(getByPlaceholderText(CONFIRM).props.secureTextEntry).toBe(false);
    });

    it('deve avisar e bloquear o salvamento quando as senhas forem diferentes', async () => {
      const { getByPlaceholderText, getByText } = await renderUnlocked();

      fireEvent.changeText(getByPlaceholderText(NEW), 'senha123');
      fireEvent.changeText(getByPlaceholderText(CONFIRM), 'senha999');
      expect(getByText('As senhas não conferem.')).toBeTruthy();

      await act(async () => {
        fireEvent.press(getByText('Salvar Alterações'));
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Senhas diferentes',
        'A confirmação precisa ser igual à nova senha.'
      );
      expect(onboardingService.saveUserProfile).not.toHaveBeenCalled();
      expect(sessionService.saveCredentials).not.toHaveBeenCalled();
    });

    it('deve bloquear quando a confirmação estiver vazia', async () => {
      const { getByPlaceholderText, getByText, queryByText } =
        await renderUnlocked();

      fireEvent.changeText(getByPlaceholderText(NEW), 'senha123');
      expect(queryByText('As senhas não conferem.')).toBeNull();

      await act(async () => {
        fireEvent.press(getByText('Salvar Alterações'));
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Senhas diferentes',
        'A confirmação precisa ser igual à nova senha.'
      );
      expect(onboardingService.saveUserProfile).not.toHaveBeenCalled();
    });

    it('deve limpar e esconder a confirmação ao apagar a nova senha', async () => {
      const { getByPlaceholderText, queryByPlaceholderText } =
        await renderUnlocked();

      fireEvent.changeText(getByPlaceholderText(NEW), 'senha123');
      fireEvent.changeText(getByPlaceholderText(CONFIRM), 'senha123');
      fireEvent.changeText(getByPlaceholderText(NEW), '');
      expect(queryByPlaceholderText(CONFIRM)).toBeNull();

      fireEvent.changeText(getByPlaceholderText(NEW), 'x');
      expect(getByPlaceholderText(CONFIRM).props.value).toBe('');
    });

    it('deve ir para a confirmação pelo teclado e salvar ao concluir', async () => {
      onboardingService.saveUserProfile.mockResolvedValueOnce();
      sessionService.getCredentials
        .mockResolvedValueOnce({ passwordHash: 'hash' })
        .mockResolvedValueOnce({
          usuario: 'irlam@test.com',
          hasBiometrics: false,
        });
      const focusSpy = jest.spyOn(TextInput.prototype, 'focus');
      const { getByPlaceholderText } = await renderUnlocked();

      fireEvent.changeText(getByPlaceholderText(NEW), 'senha123');
      fireEvent(getByPlaceholderText(NEW), 'submitEditing');
      expect(focusSpy).toHaveBeenCalledTimes(1);
      focusSpy.mockRestore();

      fireEvent.changeText(getByPlaceholderText(CONFIRM), ' senha123 ');
      await act(async () => {
        fireEvent(getByPlaceholderText(CONFIRM), 'submitEditing');
      });

      expect(sessionService.saveCredentials).toHaveBeenCalledWith(
        'irlam@test.com',
        'senha123',
        false
      );
    });

    it('deve limpar a confirmação ao cancelar a edição', async () => {
      const { getByPlaceholderText, getByText, queryByPlaceholderText } =
        await renderUnlocked();

      fireEvent.changeText(getByPlaceholderText(NEW), 'senha123');
      fireEvent.changeText(getByPlaceholderText(CONFIRM), 'senha123');
      fireEvent.press(getByText('Cancelar'));
      await unlockEditing();

      expect(getByPlaceholderText(NEW).props.value).toBe('');
      expect(queryByPlaceholderText(CONFIRM)).toBeNull();
    });
  });
});
