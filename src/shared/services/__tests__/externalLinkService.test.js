import { externalLinkService, buildRouteUrl } from '../externalLinkService';

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

  describe('openWhatsApp', () => {
    it('deve abrir o WhatsApp com o telefone fornecido', () => {
      const phone = '5511988887777';
      const expectedMessage = encodeURIComponent(
        'Olá! Vi seu post sobre o pet no FindPets e gostaria de ajudar.'
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

  describe('openRoute', () => {
    it('deve montar a rota no Apple Maps para iOS e no Google Maps para Android', () => {
      expect(buildRouteUrl(-23.55, -46.63, 'ios')).toBe(
        'http://maps.apple.com/?daddr=-23.55,-46.63'
      );
      expect(buildRouteUrl(-23.55, -46.63, 'android')).toBe(
        'https://www.google.com/maps/dir/?api=1&destination=-23.55,-46.63'
      );
    });

    it('deve abrir o app de mapas com a rota até o local', () => {
      externalLinkService.openRoute(-23.55, -46.63);

      expect(Linking.openURL).toHaveBeenCalledTimes(1);
      expect(Linking.openURL.mock.calls[0][0]).toContain('-23.55,-46.63');
    });

    it('não deve abrir o app de mapas sem coordenadas', () => {
      externalLinkService.openRoute(null, -46.63);
      externalLinkService.openRoute(-23.55, undefined);

      expect(Linking.openURL).not.toHaveBeenCalled();
    });
  });
});
