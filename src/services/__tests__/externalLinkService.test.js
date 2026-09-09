import { externalLinkService } from '../externalLinkService';

// Mock limpo e direto do módulo Linking sem quebrar o ecossistema do Expo
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return Object.setPrototypeOf(
    {
      Linking: {
        openURL: jest.fn(() => Promise.resolve(true)),
      },
    },
    RN
  );
});

import { Linking } from 'react-native';

describe('externalLinkService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('openMap', () => {
    it('deve abrir o Google Maps usando latitude e longitude', () => {
      externalLinkService.openMap(-23.5505, -46.6333, 'São Paulo, SP');

      expect(Linking.openURL).toHaveBeenCalledWith(
        'https://www.google.com/maps/search/?api=1&query=-23.5505,-46.6333'
      );
    });

    it('deve abrir o Google Maps usando o endereço caso não haja coordenadas', () => {
      const address = 'Avenida Paulista, 1000';
      externalLinkService.openMap(null, null, address);

      expect(Linking.openURL).toHaveBeenCalledWith(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      );
    });

    it('não deve chamar openURL se não houver coordenadas nem endereço', () => {
      externalLinkService.openMap(null, null, null);

      expect(Linking.openURL).not.toHaveBeenCalled();
    });
  });

  describe('openWhatsApp', () => {
    it('deve abrir o WhatsApp com o telefone fornecido', () => {
      const phone = '5511988887777';
      const expectedMessage = encodeURIComponent(
        'Olá! Vi seu post sobre o pet no Find Pets e gostaria de ajudar.'
      );

      externalLinkService.openWhatsApp(phone);

      expect(Linking.openURL).toHaveBeenCalledWith(
        `https://wa.me/${phone}?text=${expectedMessage}`
      );
    });

    it('não deve abrir o WhatsApp se nenhum número for fornecido', () => {
      externalLinkService.openWhatsApp(null);

      expect(Linking.openURL).not.toHaveBeenCalled();
    });
  });
});
