import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { PetCard, getPostImages } from '../PetCard';

/* eslint-disable react/prop-types */
jest.mock('../../../map/components/LocationMap', () => ({
  LocationMap: ({ latitude, longitude }) => {
    const { Text: RNText } = require('react-native');
    return <RNText>{`mapa:${latitude},${longitude}`}</RNText>;
  },
}));
/* eslint-enable react/prop-types */

describe('PetCard', () => {
  const baseItem = {
    id: '1',
    images: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
    imageUri: 'https://example.com/a.jpg',
    description: 'Cachorro caramelo com coleira azul',
    type: 'Perdido',
    status: 'Perdido',
    date: '25/09/2026',
    occurredAt: new Date(2026, 8, 25, 14, 30).toISOString(),
    latitude: -23.5505,
    longitude: -46.6333,
    location: 'Av. Paulista, 1000 - São Paulo',
    contactPhone: '5511999999999',
  };

  const handlers = {
    onOpenPhoto: jest.fn(),
    onOpenMap: jest.fn(),
    onOpenWhatsApp: jest.fn(),
    onOpenRoute: jest.fn(),
    onShare: jest.fn(),
  };

  // O carrossel (FlatList) agenda atualizações internas com timers; com
  // timers simulados elas rodam dentro do act(...) ao fim de cada teste
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('deve exibir fotos, descrição, data/hora, endereço e mapa', () => {
    const { getAllByTestId, getByText } = render(
      <PetCard item={baseItem} {...handlers} />
    );

    const images = getAllByTestId('pet-image');
    expect(images).toHaveLength(2);
    expect(images[1].props.source).toEqual({ uri: baseItem.images[1] });
    expect(getByText('1/2')).toBeTruthy();
    expect(getByText('Perdido')).toBeTruthy();
    expect(getByText('Cachorro caramelo com coleira azul')).toBeTruthy();
    expect(
      getByText('Desapareceu em: 25/09/2026 às 14:30 (BRT, UTC-3)')
    ).toBeTruthy();
    expect(getByText('Av. Paulista, 1000 - São Paulo')).toBeTruthy();
    expect(getByText('mapa:-23.5505,-46.6333')).toBeTruthy();
  });

  it('deve abrir a foto tocada em tela cheia', () => {
    const { getByLabelText } = render(
      <PetCard item={baseItem} {...handlers} />
    );

    fireEvent.press(getByLabelText('Ver foto 2 em tela cheia'));
    expect(handlers.onOpenPhoto).toHaveBeenCalledWith(1);
  });

  it('deve atualizar o contador ao deslizar as fotos', () => {
    const { getByText, getByTestId, UNSAFE_getByProps } = render(
      <PetCard item={baseItem} {...handlers} />
    );
    const list = UNSAFE_getByProps({ pagingEnabled: true });
    const scrollToSecond = {
      nativeEvent: { contentOffset: { x: 300 } },
    };

    // Sem largura medida ainda, ignora o evento
    fireEvent(list, 'momentumScrollEnd', scrollToSecond);
    expect(getByText('1/2')).toBeTruthy();

    fireEvent(getByTestId('pet-carousel'), 'layout', {
      nativeEvent: { layout: { width: 300 } },
    });
    fireEvent(list, 'momentumScrollEnd', scrollToSecond);
    expect(getByText('2/2')).toBeTruthy();
  });

  it('deve abrir o mapa em tela cheia, o WhatsApp e a rota', () => {
    const { getByTestId, getByText } = render(
      <PetCard item={baseItem} {...handlers} />
    );

    fireEvent.press(getByTestId('button-open-map'));
    fireEvent.press(getByText('WhatsApp'));
    fireEvent.press(getByText('Como chegar'));

    expect(handlers.onOpenMap).toHaveBeenCalledTimes(1);
    expect(handlers.onOpenWhatsApp).toHaveBeenCalledWith('5511999999999');
    expect(handlers.onOpenRoute).toHaveBeenCalledTimes(1);
  });

  it('deve suportar registros antigos com uma foto e sem descrição', () => {
    const legacyItem = {
      id: '2',
      imageUri: 'https://example.com/old.jpg',
      type: 'Perdido',
      date: '10/06/2026',
    };

    const { getAllByTestId, getByText, queryByText } = render(
      <PetCard item={legacyItem} {...handlers} />
    );

    expect(getAllByTestId('pet-image')).toHaveLength(1);
    expect(queryByText('1/1')).toBeNull();
    expect(getByText('Perdido')).toBeTruthy();
    expect(getByText('Desapareceu em: 10/06/2026')).toBeTruthy();
    // Sem coordenadas não há como traçar rota
    expect(queryByText('Como chegar')).toBeNull();
    expect(queryByText('Cachorro caramelo com coleira azul')).toBeNull();
  });

  it('deve exibir as ações de dono', () => {
    const onDelete = jest.fn();
    const onMarkFound = jest.fn();
    const { getByLabelText, getByText } = render(
      <PetCard
        item={baseItem}
        {...handlers}
        onDelete={onDelete}
        onMarkFound={onMarkFound}
      />
    );

    fireEvent.press(getByLabelText('Marcar como encontrado'));
    fireEvent.press(getByText('Excluir'));
    expect(onMarkFound).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('deve exibir o selo e os dados completos do reencontro', () => {
    const foundInfo = {
      receiverName: 'Ana Souza',
      receiverRelation: 'Dono(a) / tutor',
      foundAt: new Date(2026, 8, 26, 9, 5).toISOString(),
      foundLocation: 'Praça Central',
      notes: 'Estava com fome, mas bem.',
    };
    const { getByText, getByTestId } = render(
      <PetCard
        item={{ ...baseItem, status: 'Encontrado', foundInfo }}
        {...handlers}
      />
    );

    expect(getByText('Encontrado')).toBeTruthy();
    expect(getByTestId('found-info')).toBeTruthy();
    expect(getByText('Com: Ana Souza (Dono(a) / tutor)')).toBeTruthy();
    expect(getByText('Em: 26/09/2026 às 09:05 (BRT, UTC-3)')).toBeTruthy();
    expect(getByText('Onde: Praça Central')).toBeTruthy();
    expect(getByText('Estava com fome, mas bem.')).toBeTruthy();
  });

  it('deve exibir as horas no fuso em que foram registradas', () => {
    const { getByText } = render(
      <PetCard
        item={{
          ...baseItem,
          status: 'Encontrado',
          occurredAt: '2026-09-25T17:30:00.000Z',
          occurredZone: { offsetMinutes: 540, abbreviation: null },
          foundInfo: {
            receiverName: 'Ana',
            receiverRelation: 'Outro',
            foundAt: '2026-09-26T12:00:00.000Z',
            foundZone: { offsetMinutes: 60, abbreviation: 'CET' },
          },
        }}
        {...handlers}
      />
    );

    expect(
      getByText('Desapareceu em: 26/09/2026 às 02:30 (UTC+9)')
    ).toBeTruthy();
    expect(getByText('Em: 26/09/2026 às 13:00 (CET, UTC+1)')).toBeTruthy();
  });

  it('deve omitir local e observações do reencontro quando vazios', () => {
    const { getByTestId, queryByText } = render(
      <PetCard
        item={{
          ...baseItem,
          status: 'Encontrado',
          foundInfo: {
            receiverName: 'Ana',
            receiverRelation: 'Outro',
            foundAt: new Date(2026, 8, 26, 9, 5).toISOString(),
            foundLocation: '',
            notes: '',
          },
        }}
        {...handlers}
      />
    );

    expect(getByTestId('found-info')).toBeTruthy();
    expect(queryByText(/Onde:/)).toBeNull();
  });

  it('deve exibir apenas a exclusão quando não puder marcar como encontrado', () => {
    const { getByText, queryByLabelText } = render(
      <PetCard item={baseItem} {...handlers} onDelete={jest.fn()} />
    );

    expect(getByText('Excluir')).toBeTruthy();
    expect(queryByLabelText('Marcar como encontrado')).toBeNull();
  });

  it('getPostImages deve priorizar a lista de fotos', () => {
    expect(getPostImages({ images: ['a', 'b'], imageUri: 'a' })).toEqual([
      'a',
      'b',
    ]);
    expect(getPostImages({ images: [], imageUri: 'x' })).toEqual(['x']);
  });

  it('deve exibir apenas o botão de encontrado quando não puder excluir', () => {
    const { getByLabelText, queryByText } = render(
      <PetCard item={baseItem} {...handlers} onMarkFound={jest.fn()} />
    );

    expect(getByLabelText('Marcar como encontrado')).toBeTruthy();
    expect(queryByText('Excluir')).toBeNull();
  });

  describe('dados do pet', () => {
    const petItem = {
      ...baseItem,
      petName: 'Rex',
      species: 'Cachorro',
      size: 'Médio',
      sex: 'Macho',
      color: 'Caramelo',
    };

    it('deve mostrar cada dado do pet com seu rótulo', () => {
      const { getByText, getByTestId } = render(
        <PetCard item={petItem} {...handlers} />
      );

      expect(getByTestId('pet-info-grid')).toBeTruthy();
      [
        ['Nome', 'Rex'],
        ['Espécie', 'Cachorro'],
        ['Porte', 'Médio'],
        ['Sexo', 'Macho'],
        ['Cor', 'Caramelo'],
      ].forEach(([label, value]) => {
        expect(getByText(label)).toBeTruthy();
        expect(getByText(value)).toBeTruthy();
      });
    });

    it('deve mostrar só os dados preenchidos', () => {
      const { queryByText, getByText } = render(
        <PetCard item={{ ...petItem, petName: '', color: '' }} {...handlers} />
      );

      expect(getByText('Cachorro')).toBeTruthy();
      expect(queryByText('Nome')).toBeNull();
      expect(queryByText('Cor')).toBeNull();
    });

    it('não deve mostrar a grade de dados em registros antigos', () => {
      const { queryByTestId } = render(
        <PetCard
          item={{ id: '9', imageUri: 'x.jpg', type: 'Perdido', date: '1/1' }}
          {...handlers}
        />
      );

      expect(queryByTestId('pet-info-grid')).toBeNull();
    });
  });

  it('deve compartilhar e editar o registro', () => {
    const onEdit = jest.fn();
    const { getByLabelText } = render(
      <PetCard item={baseItem} {...handlers} onEdit={onEdit} />
    );

    fireEvent.press(getByLabelText('Compartilhar este registro'));
    fireEvent.press(getByLabelText('Editar registro'));

    expect(handlers.onShare).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('não deve mostrar o botão editar sem permissão', () => {
    const { queryByLabelText, getByLabelText } = render(
      <PetCard item={baseItem} {...handlers} />
    );

    expect(queryByLabelText('Editar registro')).toBeNull();
    // Compartilhar fica disponível para todos
    expect(getByLabelText('Compartilhar este registro')).toBeTruthy();
  });
});
