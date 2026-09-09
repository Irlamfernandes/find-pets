import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import FeedScreen from '../FeedScreen';
import { postService } from '../../services/postService';
import { externalLinkService } from '../../services/externalLinkService';
import { onboardingService } from '../../services/onboarding';

jest.mock('../../services/postService', () => ({
  postService: {
    getPosts: jest.fn(),
    savePost: jest.fn(),
  },
}));

jest.mock('../../services/externalLinkService', () => ({
  externalLinkService: {
    openMap: jest.fn(),
    openWhatsApp: jest.fn(),
  },
}));

// Adicionado o mock do onboardingService para suprir a dependência do useFeed
jest.mock('../../services/onboarding', () => ({
  onboardingService: {
    getUserProfile: jest
      .fn()
      .mockResolvedValue({ name: 'Irlam', whatsapp: '11999999999' }),
  },
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: () => [
    { granted: true },
    jest.fn().mockResolvedValue({ granted: true }),
  ],
}));

describe('FeedScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar o feed vazio corretamente', async () => {
    postService.getPosts.mockResolvedValueOnce([]);

    const { getByText } = render(<FeedScreen />);

    await waitFor(() => {
      expect(getByText('Nenhum pet cadastrado ainda.')).toBeTruthy();
    });
  });

  it('deve renderizar posts salvos na lista e chamar openMap ao clicar no botão de mapa', async () => {
    const mockPosts = [
      {
        id: '123',
        imageUri: 'https://example.com/pet.jpg',
        date: '05/09/2026',
        type: 'Perdido',
        latitude: -22.5,
        longitude: -44.1,
        location: 'Rua Teste',
      },
    ];
    postService.getPosts.mockResolvedValueOnce(mockPosts);

    const { getByText } = render(<FeedScreen />);

    await waitFor(() => {
      expect(getByText('Perdido')).toBeTruthy();
      const mapBtn = getByText('📍 Ver no Mapa');
      expect(mapBtn).toBeTruthy();

      fireEvent.press(mapBtn);
      expect(externalLinkService.openMap).toHaveBeenCalledTimes(1);
      expect(externalLinkService.openMap).toHaveBeenCalledWith(
        -22.5,
        -44.1,
        'Rua Teste'
      );
    });
  });

  it('deve chamar openWhatsApp ao clicar no botão do WhatsApp no card', async () => {
    const mockPosts = [
      {
        id: '124',
        imageUri: 'https://example.com/pet2.jpg',
        date: '05/09/2026',
        type: 'Encontrado',
        contactPhone: '5511999999999',
      },
    ];
    postService.getPosts.mockResolvedValueOnce(mockPosts);

    const { getByText } = render(<FeedScreen />);

    await waitFor(() => {
      const whatsappBtn = getByText('💬 WhatsApp');
      expect(whatsappBtn).toBeTruthy();

      fireEvent.press(whatsappBtn);
      expect(externalLinkService.openWhatsApp).toHaveBeenCalledTimes(1);
      expect(externalLinkService.openWhatsApp).toHaveBeenCalledWith(
        '5511999999999'
      );
    });
  });

  it('deve chamar a função onLogout ao clicar no botão Sair', async () => {
    postService.getPosts.mockResolvedValueOnce([]);
    const mockLogout = jest.fn();

    const { getByText } = render(<FeedScreen onLogout={mockLogout} />);

    await waitFor(() => {
      const logoutBtn = getByText('Sair');
      fireEvent.press(logoutBtn);
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  it('deve abrir e fechar o modal da câmera', async () => {
    postService.getPosts.mockResolvedValueOnce([]);

    const { getByText } = render(<FeedScreen />);

    await waitFor(() => {
      const fabButton = getByText('📷');
      fireEvent.press(fabButton);
    });

    const cancelButton = getByText('Cancelar');
    expect(cancelButton).toBeTruthy();

    fireEvent.press(cancelButton);
  });
});
