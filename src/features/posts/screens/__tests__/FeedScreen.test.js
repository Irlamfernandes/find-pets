import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import FeedScreen from '../FeedScreen';
import { useFeed } from '../../hooks/useFeed';
import { useFeedGuide } from '../../hooks/useFeedGuide';
import { shareService } from '../../services/shareService';
import { externalLinkService } from '../../../../shared/services/externalLinkService';

jest.mock('../../hooks/useFeed', () => ({
  useFeed: jest.fn(),
}));

jest.mock('../../services/shareService', () => ({
  shareService: { sharePoster: jest.fn() },
}));

/* eslint-disable react/prop-types */
jest.mock('../../../map/components/LostPetsMap', () => ({
  LostPetsMap: ({ posts, onSelect, onClear }) => {
    const {
      TouchableOpacity: RNTouchable,
      Text: RNText,
    } = require('react-native');
    return (
      <>
        <RNText>{`pontos:${posts.map((post) => post.id).join(',')}`}</RNText>
        {posts.map((post) => (
          <RNTouchable
            key={post.id}
            testID={`ponto-${post.id}`}
            onPress={() => onSelect(post.id)}
          />
        ))}
        <RNTouchable testID="mapa-fundo" onPress={onClear} />
      </>
    );
  },
}));
/* eslint-enable react/prop-types */

jest.mock('../../hooks/useFeedGuide', () => ({
  useFeedGuide: jest.fn(),
}));

jest.mock('../../../../shared/services/externalLinkService', () => ({
  externalLinkService: {
    openWhatsApp: jest.fn(),
    openRoute: jest.fn(),
  },
}));

/* eslint-disable react/prop-types */
jest.mock('../../components/PetCard', () => ({
  PetCard: ({
    item,
    onOpenPhoto,
    onOpenMap,
    onOpenWhatsApp,
    onOpenRoute,
    onShare,
    onEdit,
    onDelete,
    onMarkFound,
  }) => {
    const {
      TouchableOpacity: RNTouchable,
      Text: RNText,
    } = require('react-native');
    return (
      <RNTouchable testID={`pet-card-${item.id}`} onPress={() => onDelete?.()}>
        <RNText>{item.type}</RNText>
        <RNTouchable
          testID={`photo-${item.id}`}
          onPress={() => onOpenPhoto(1)}
        />
        <RNTouchable testID={`map-${item.id}`} onPress={onOpenMap} />
        <RNTouchable
          testID={`whatsapp-${item.id}`}
          onPress={() => onOpenWhatsApp('5511999999999')}
        />
        <RNTouchable testID={`route-${item.id}`} onPress={onOpenRoute} />
        <RNTouchable testID={`share-${item.id}`} onPress={onShare} />
        {onEdit ? (
          <RNTouchable testID={`edit-${item.id}`} onPress={onEdit} />
        ) : null}
        {onMarkFound ? (
          <RNTouchable testID={`mark-found-${item.id}`} onPress={onMarkFound} />
        ) : null}
      </RNTouchable>
    );
  },
}));

jest.mock('../../../../shared/components/PhotoViewerModal', () => ({
  PhotoViewerModal: ({ images, initialIndex, onClose }) => {
    const {
      TouchableOpacity: RNTouchable,
      Text: RNText,
    } = require('react-native');
    return images.length ? (
      <RNTouchable testID="photo-viewer" onPress={onClose}>
        <RNText>{`fotos:${images.join(',')}|inicio:${initialIndex}`}</RNText>
      </RNTouchable>
    ) : null;
  },
}));

jest.mock('../../../map/components/MapViewerModal', () => ({
  MapViewerModal: ({ post, onClose }) => {
    const {
      TouchableOpacity: RNTouchable,
      Text: RNText,
    } = require('react-native');
    return post ? (
      <RNTouchable testID="map-viewer" onPress={onClose}>
        <RNText>{`mapa:${post.id}`}</RNText>
      </RNTouchable>
    ) : null;
  },
}));
jest.mock('../../components/FoundPetModal', () => ({
  FoundPetModal: ({ visible, onCancel, onConfirm }) => {
    const {
      TouchableOpacity: RNTouchable,
      Text: RNText,
    } = require('react-native');
    return visible ? (
      <>
        <RNText>reencontro</RNText>
        <RNTouchable testID="found-cancel" onPress={onCancel} />
        <RNTouchable
          testID="found-confirm"
          onPress={() => onConfirm({ receiverName: 'Ana' })}
        />
      </>
    ) : null;
  },
}));
/* eslint-enable react/prop-types */

const testIdsInOrder = (node, found = []) => {
  if (node.props?.testID) found.push(node.props.testID);
  node.children.forEach((child) => {
    if (typeof child !== 'string') testIdsInOrder(child, found);
  });
  return found;
};

describe('FeedScreen', () => {
  const mockGuide = {
    isGuideVisible: false,
    dismissGuide: jest.fn(),
    showGuide: jest.fn(),
  };
  const mockOnOpenReport = jest.fn();
  const mockUseFeedReturn = {
    posts: [],
    userName: 'Irlam',
    currentUser: null,
    deletePost: jest.fn(),
    isFoundFormOpen: false,
    markPostAsFound: jest.fn(),
    cancelFound: jest.fn(),
    confirmFound: jest.fn(),
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    useFeed.mockReturnValue(mockUseFeedReturn);
    useFeedGuide.mockReturnValue(mockGuide);
  });

  afterEach(async () => {
    await act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('deve renderizar o cabeçalho e as abas, sem texto de lista vazia', async () => {
    const { getByText } = await render(
      <FeedScreen onOpenReport={mockOnOpenReport} />
    );

    expect(getByText('FindPets')).toBeTruthy();
    expect(getByText('Olá, Irlam')).toBeTruthy();
  });

  it('não deve exibir saudação se o userName estiver vazio', async () => {
    useFeed.mockReturnValue({ ...mockUseFeedReturn, userName: '' });

    const { queryByText } = await render(
      <FeedScreen onOpenReport={mockOnOpenReport} />
    );
    expect(queryByText(/Olá,/)).toBeNull();
  });

  it('deve abrir o perfil e a tela de registro pelas abas', async () => {
    const mockOnOpenProfile = jest.fn();
    const { getByText } = await render(
      <FeedScreen
        onOpenProfile={mockOnOpenProfile}
        onOpenReport={mockOnOpenReport}
      />
    );

    await fireEvent.press(getByText('Perfil'));
    await fireEvent.press(getByText('Registrar desaparecimento'));

    expect(mockOnOpenProfile).toHaveBeenCalledTimes(1);
    expect(mockOnOpenReport).toHaveBeenCalledTimes(1);
  });

  it('deve abrir e fechar as fotos em tela cheia a partir do card', async () => {
    useFeed.mockReturnValue({
      ...mockUseFeedReturn,
      posts: [{ id: '1', status: 'Perdido', images: ['a.jpg', 'b.jpg'] }],
    });

    const { getByTestId, getByText, queryByTestId } = await render(
      <FeedScreen onOpenReport={mockOnOpenReport} />
    );

    await fireEvent.press(getByTestId('photo-1'));
    expect(getByText('fotos:a.jpg,b.jpg|inicio:1')).toBeTruthy();

    await fireEvent.press(getByTestId('photo-viewer'));
    expect(queryByTestId('photo-viewer')).toBeNull();
  });

  it('deve abrir e fechar o mapa em tela cheia a partir do card', async () => {
    useFeed.mockReturnValue({
      ...mockUseFeedReturn,
      posts: [{ id: '1', status: 'Perdido', images: ['a.jpg'] }],
    });

    const { getByTestId, getByText, queryByTestId } = await render(
      <FeedScreen onOpenReport={mockOnOpenReport} />
    );

    await fireEvent.press(getByTestId('map-1'));
    expect(getByText('mapa:1')).toBeTruthy();

    await fireEvent.press(getByTestId('map-viewer'));
    expect(queryByTestId('map-viewer')).toBeNull();
  });

  it('deve abrir o WhatsApp e a rota a partir do card', async () => {
    useFeed.mockReturnValue({
      ...mockUseFeedReturn,
      posts: [
        {
          id: '1',
          status: 'Perdido',
          images: ['a.jpg'],
          latitude: -23.5,
          longitude: -46.6,
        },
      ],
    });

    const { getByTestId } = await render(
      <FeedScreen onOpenReport={mockOnOpenReport} />
    );

    await fireEvent.press(getByTestId('whatsapp-1'));
    expect(externalLinkService.openWhatsApp).toHaveBeenCalledWith(
      '5511999999999'
    );

    await fireEvent.press(getByTestId('route-1'));
    expect(externalLinkService.openRoute).toHaveBeenCalledWith(-23.5, -46.6);
  });

  it('deve habilitar exclusão e finalização quando o post pertence ao usuário', async () => {
    useFeed.mockReturnValue({
      ...mockUseFeedReturn,
      currentUser: 'user1@test.com',
      posts: [{ id: '1', status: 'Perdido', author: 'user1@test.com' }],
    });

    const { getByTestId } = await render(
      <FeedScreen onOpenReport={mockOnOpenReport} />
    );

    await fireEvent.press(getByTestId('pet-card-1'));
    await fireEvent.press(getByTestId('mark-found-1'));
    expect(mockUseFeedReturn.deletePost).toHaveBeenCalledWith('1');
    expect(mockUseFeedReturn.markPostAsFound).toHaveBeenCalledWith('1');
  });

  it('deve ocultar ações quando o post pertence a outro usuário ou já foi encontrado', async () => {
    useFeed.mockReturnValue({
      ...mockUseFeedReturn,
      currentUser: 'user1@test.com',
      posts: [
        { id: '1', status: 'Perdido', author: 'user2@test.com' },
        {
          id: '2',
          status: 'Encontrado',
          author: 'user1@test.com',
        },
      ],
    });

    const { queryByTestId, getByTestId } = await render(
      <FeedScreen onOpenReport={mockOnOpenReport} />
    );

    expect(queryByTestId('mark-found-1')).toBeNull();
    expect(queryByTestId('mark-found-2')).toBeNull();
    await fireEvent.press(getByTestId('pet-card-1'));
    expect(mockUseFeedReturn.deletePost).not.toHaveBeenCalled();
  });

  it('deve exibir o formulário de reencontro', async () => {
    useFeed.mockReturnValue({ ...mockUseFeedReturn, isFoundFormOpen: true });

    const { getByText, getByTestId } = await render(
      <FeedScreen onOpenReport={mockOnOpenReport} />
    );

    expect(getByText('reencontro')).toBeTruthy();
    await fireEvent.press(getByTestId('found-confirm'));
    await fireEvent.press(getByTestId('found-cancel'));
    expect(mockUseFeedReturn.confirmFound).toHaveBeenCalledWith({
      receiverName: 'Ana',
    });
    expect(mockUseFeedReturn.cancelFound).toHaveBeenCalledTimes(1);
  });

  it('deve exibir a foto do usuário no topo e abrir o perfil ao tocar', async () => {
    const mockOnOpenProfile = jest.fn();
    useFeed.mockReturnValue({ ...mockUseFeedReturn, userPhoto: 'eu.jpg' });

    const { getByLabelText, getByTestId } = await render(
      <FeedScreen
        onOpenProfile={mockOnOpenProfile}
        onOpenReport={mockOnOpenReport}
      />
    );

    expect(getByTestId('user-avatar-image').props.source).toEqual({
      uri: 'eu.jpg',
    });
    await fireEvent.press(getByLabelText('Abrir meu perfil'));
    expect(mockOnOpenProfile).toHaveBeenCalledTimes(1);
  });

  it('deve mostrar o aviso de orientação antes das postagens e dispensar', async () => {
    useFeedGuide.mockReturnValue({ ...mockGuide, isGuideVisible: true });
    useFeed.mockReturnValue({
      ...mockUseFeedReturn,
      currentUser: 'ana@test.com',
      posts: [{ id: '1', status: 'Perdido', images: ['a.jpg'] }],
    });

    const { getByTestId, getByText, queryByLabelText, container } =
      await render(<FeedScreen onOpenReport={mockOnOpenReport} />);

    expect(useFeedGuide).toHaveBeenCalledWith('ana@test.com');
    const order = testIdsInOrder(container);
    expect(order.indexOf('feed-guide')).toBeGreaterThan(-1);
    expect(order.indexOf('feed-guide')).toBeLessThan(
      order.indexOf('pet-card-1')
    );
    expect(queryByLabelText('Como funciona o app')).toBeNull();

    await fireEvent.press(getByText('Entendi'));
    expect(mockGuide.dismissGuide).toHaveBeenCalledTimes(1);
    expect(getByTestId('feed-guide')).toBeTruthy();
  });

  it('deve filtrar os registros por espécie e texto e limpar os filtros', async () => {
    useFeed.mockReturnValue({
      ...mockUseFeedReturn,
      posts: [
        { id: '1', status: 'Perdido', species: 'Cachorro', petName: 'Rex' },
        { id: '2', status: 'Perdido', species: 'Gato', petName: 'Mimi' },
      ],
    });
    const { getByTestId, getByText, queryByTestId } = await render(
      <FeedScreen onOpenReport={mockOnOpenReport} />
    );
    expect(getByTestId('pet-card-1')).toBeTruthy();
    expect(getByTestId('pet-card-2')).toBeTruthy();
    expect(queryByTestId('feed-filter-empty')).toBeNull();

    await fireEvent.press(getByText('Gato'));
    expect(queryByTestId('pet-card-1')).toBeNull();
    expect(getByTestId('pet-card-2')).toBeTruthy();

    await fireEvent.changeText(getByTestId('input-feed-search'), 'rex');
    expect(queryByTestId('pet-card-2')).toBeNull();
    expect(getByTestId('feed-filter-empty')).toBeTruthy();

    await fireEvent.press(getByTestId('button-clear-filters'));
    expect(getByTestId('pet-card-1')).toBeTruthy();
    expect(getByTestId('pet-card-2')).toBeTruthy();
    expect(getByTestId('input-feed-search').props.value).toBe('');
  });

  it('deve reabrir o aviso pelo botão de ajuda', async () => {
    const { getByLabelText, queryByTestId } = await render(
      <FeedScreen onOpenReport={mockOnOpenReport} />
    );

    expect(queryByTestId('feed-guide')).toBeNull();
    await fireEvent.press(getByLabelText('Como funciona o app'));
    expect(mockGuide.showGuide).toHaveBeenCalledTimes(1);
  });

  it('deve abrir o cartaz do registro e compartilhar a imagem', async () => {
    const post = { id: '1', status: 'Perdido', images: ['a.jpg'] };
    useFeed.mockReturnValue({ ...mockUseFeedReturn, posts: [post] });

    const { getByTestId, getByText, queryByText } = await render(
      <FeedScreen onOpenReport={mockOnOpenReport} />
    );

    await fireEvent.press(getByTestId('share-1'));
    expect(getByText('Compartilhar cartaz')).toBeTruthy();

    await fireEvent(getByTestId('share-poster-image'), 'loadEnd');
    await act(async () => {
      await fireEvent.press(getByText('Compartilhar'));
    });
    expect(shareService.sharePoster).toHaveBeenCalledTimes(1);

    await fireEvent.press(getByText('Cancelar'));
    expect(queryByText('Compartilhar cartaz')).toBeNull();
  });

  it('deve permitir editar só os registros ativos do próprio usuário', async () => {
    const mockOnEditPost = jest.fn();
    const own = { id: '1', status: 'Perdido', author: 'eu@test.com' };
    useFeed.mockReturnValue({
      ...mockUseFeedReturn,
      currentUser: 'eu@test.com',
      posts: [
        own,
        { id: '2', status: 'Perdido', author: 'outro@test.com' },
        {
          id: '3',
          status: 'Encontrado',
          author: 'eu@test.com',
        },
      ],
    });

    const { getByTestId, queryByTestId, rerender } = await render(
      <FeedScreen onOpenReport={mockOnOpenReport} onEditPost={mockOnEditPost} />
    );

    await fireEvent.press(getByTestId('edit-1'));
    expect(mockOnEditPost).toHaveBeenCalledWith(own);
    expect(queryByTestId('edit-2')).toBeNull();
    expect(queryByTestId('edit-3')).toBeNull();

    await rerender(<FeedScreen onOpenReport={mockOnOpenReport} />);
    expect(queryByTestId('edit-1')).toBeNull();
  });

  describe('mapa com todos os pets perdidos', () => {
    const lostPost = {
      id: '1',
      status: 'Perdido',
      images: ['a.jpg'],
      petName: 'Rex',
      latitude: -23.5,
      longitude: -46.6,
      contactPhone: '5511999999999',
    };

    beforeEach(() => {
      useFeed.mockReturnValue({
        ...mockUseFeedReturn,
        posts: [
          lostPost,
          { id: '2', status: 'Perdido', images: ['b.jpg'] },
          {
            id: '3',
            status: 'Encontrado',
            images: ['c.jpg'],
            latitude: 1,
            longitude: 2,
          },
        ],
      });
    });

    it('deve alternar entre lista e mapa só com pets perdidos localizados', async () => {
      const { getByText, queryByTestId, getByTestId } = await render(
        <FeedScreen onOpenReport={mockOnOpenReport} />
      );

      expect(getByTestId('pet-card-1')).toBeTruthy();
      await fireEvent.press(getByText('Mapa'));

      expect(getByText('pontos:1')).toBeTruthy();
      expect(queryByTestId('pet-card-1')).toBeNull();

      await fireEvent.press(getByText('Lista'));
      expect(getByTestId('pet-card-1')).toBeTruthy();
    });

    it('deve mostrar o resumo ao tocar num ponto e fechá-lo', async () => {
      const { getByText, getByTestId, queryByTestId, getByLabelText } =
        await render(<FeedScreen onOpenReport={mockOnOpenReport} />);
      await fireEvent.press(getByText('Mapa'));

      await fireEvent.press(getByTestId('ponto-1'));
      expect(getByTestId('map-pet-summary')).toBeTruthy();
      expect(getByText('Rex')).toBeTruthy();

      await fireEvent.press(getByText('WhatsApp'));
      await fireEvent.press(getByText('Como chegar'));
      expect(externalLinkService.openWhatsApp).toHaveBeenCalledWith(
        '5511999999999'
      );
      expect(externalLinkService.openRoute).toHaveBeenCalledWith(-23.5, -46.6);

      await fireEvent.press(getByLabelText('Ver foto em tela cheia'));
      expect(getByText('fotos:a.jpg|inicio:0')).toBeTruthy();

      await fireEvent.press(getByLabelText('Fechar resumo'));
      expect(queryByTestId('map-pet-summary')).toBeNull();

      await fireEvent.press(getByTestId('ponto-1'));
      await fireEvent.press(getByTestId('mapa-fundo'));
      expect(queryByTestId('map-pet-summary')).toBeNull();
    });

    it('deve fechar o resumo ao voltar para a lista', async () => {
      const { getByText, getByTestId, queryByTestId } = await render(
        <FeedScreen onOpenReport={mockOnOpenReport} />
      );
      await fireEvent.press(getByText('Mapa'));
      await fireEvent.press(getByTestId('ponto-1'));

      await fireEvent.press(getByText('Lista'));
      await fireEvent.press(getByText('Mapa'));

      expect(queryByTestId('map-pet-summary')).toBeNull();
    });
  });
});
