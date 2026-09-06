import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { FeedScreen } from '../FeedScreen';
import { postService } from '../../services/postService';

jest.mock('../../services/postService', () => ({
  postService: {
    getPosts: jest.fn(),
    savePost: jest.fn(),
  },
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

  it('deve renderizar posts salvos na lista', async () => {
    const mockPosts = [
      {
        id: '123',
        imageUri: 'https://example.com/pet.jpg',
        date: '05/09/2026',
        type: 'Perdido',
      },
    ];
    postService.getPosts.mockResolvedValueOnce(mockPosts);

    const { getByText } = render(<FeedScreen />);

    await waitFor(() => {
      expect(getByText('Perdido')).toBeTruthy();
      expect(getByText('Registrado em: 05/09/2026')).toBeTruthy();
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
