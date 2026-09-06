import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';
import FeedScreen from '../FeedScreen';
import { postService } from '../../services/postService';

jest.mock('../../services/postService', () => ({
  postService: {
    getPosts: jest.fn(),
    savePost: jest.fn(),
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

jest.spyOn(Linking, 'openURL').mockImplementation(() => Promise.resolve(true));

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

  it('deve renderizar posts salvos na lista com coordenadas e abrir mapa', async () => {
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
      const locationBtn = getByText('📍 Rua Teste (Ver no mapa)');
      expect(locationBtn).toBeTruthy();

      fireEvent.press(locationBtn);
      expect(Linking.openURL).toHaveBeenCalledWith(
        'https://www.google.com/maps/search/?api=1&query=-22.5,-44.1'
      );
    });
  });

  it('deve abrir mapa usando endereço texto se não houver coordenadas', async () => {
    const mockPosts = [
      {
        id: '125',
        imageUri: 'https://example.com/pet3.jpg',
        date: '05/09/2026',
        type: 'Perdido',
        latitude: null,
        longitude: null,
        location: 'Praça Central',
      },
    ];
    postService.getPosts.mockResolvedValueOnce(mockPosts);

    const { getByText } = render(<FeedScreen />);

    await waitFor(() => {
      const locationBtn = getByText('📍 Praça Central (Ver no mapa)');
      fireEvent.press(locationBtn);
      expect(Linking.openURL).toHaveBeenCalledWith(
        'https://www.google.com/maps/search/?api=1&query=Pra%C3%A7a%20Central'
      );
    });
  });

  it('deve renderizar post sem localização informada', async () => {
    const mockPosts = [
      {
        id: '124',
        imageUri: 'https://example.com/pet2.jpg',
        date: '05/09/2026',
        type: 'Encontrado',
        location: '',
      },
    ];
    postService.getPosts.mockResolvedValueOnce(mockPosts);

    const { getByText } = render(<FeedScreen />);

    await waitFor(() => {
      expect(getByText('Encontrado')).toBeTruthy();
      expect(
        getByText('📍 Localização não informada (Ver no mapa)')
      ).toBeTruthy();
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

  it('não deve chamar openURL se não houver coordenadas nem endereço', async () => {
    const mockPosts = [
      {
        id: '126',
        imageUri: 'https://example.com/pet4.jpg',
        date: '05/09/2026',
        type: 'Perdido',
        latitude: null,
        longitude: null,
        location: '',
      },
    ];
    postService.getPosts.mockResolvedValueOnce(mockPosts);

    const { getByText } = render(<FeedScreen />);

    await waitFor(() => {
      const locationBtn = getByText(
        '📍 Localização não informada (Ver no mapa)'
      );
      fireEvent.press(locationBtn);
      expect(Linking.openURL).not.toHaveBeenCalled();
    });
  });
});
