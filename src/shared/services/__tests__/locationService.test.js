import { locationService } from '../locationService';
import * as Location from 'expo-location';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
  geocodeAsync: jest.fn(),
  Accuracy: { High: 4 },
}));

describe('locationService', () => {
  it('deve retornar as coordenadas e o endereço formatado quando a permissão for concedida', async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({
      status: 'granted',
    });
    Location.getCurrentPositionAsync.mockResolvedValueOnce({
      coords: { latitude: -22.5, longitude: -44.1 },
    });

    const result = await locationService.getCurrentLocation();
    expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith({
      accuracy: Location.Accuracy.High,
    });
    expect(result).toEqual({
      latitude: -22.5,
      longitude: -44.1,
      address: 'Lat: -22.5000, Lon: -44.1000',
    });
  });

  it('deve retornar valores nulos e mensagem de negado se a permissão não for concedida', async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({
      status: 'denied',
    });

    const result = await locationService.getCurrentLocation();
    expect(result).toEqual({
      latitude: null,
      longitude: null,
      address: 'Localização não permitida',
    });
  });

  it('deve retornar valores nulos e indisponível se ocorrer um erro', async () => {
    Location.requestForegroundPermissionsAsync.mockRejectedValueOnce(
      new Error('Erro GPS')
    );

    const result = await locationService.getCurrentLocation();
    expect(result).toEqual({
      latitude: null,
      longitude: null,
      address: 'Localização indisponível',
    });
  });

  describe('getAddressFromCoords', () => {
    const granted = () =>
      Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({
        status: 'granted',
      });

    it('deve retornar o endereço formatado quando disponível', async () => {
      granted();
      Location.reverseGeocodeAsync.mockResolvedValueOnce([
        { formattedAddress: 'Av. Paulista, 1000 - São Paulo' },
      ]);

      await expect(
        locationService.getAddressFromCoords(-23.5, -46.6)
      ).resolves.toBe('Av. Paulista, 1000 - São Paulo');
      expect(Location.reverseGeocodeAsync).toHaveBeenCalledWith({
        latitude: -23.5,
        longitude: -46.6,
      });
    });

    it('deve montar o endereço a partir das partes quando não houver formatado', async () => {
      granted();
      Location.reverseGeocodeAsync.mockResolvedValueOnce([
        {
          formattedAddress: null,
          street: 'Rua A',
          streetNumber: '10',
          district: 'Centro',
          city: 'Campinas',
        },
      ]);

      await expect(locationService.getAddressFromCoords(1, 2)).resolves.toBe(
        'Rua A, 10 - Centro - Campinas'
      );
    });

    it('deve retornar null sem permissão, sem resultado, sem partes ou com erro', async () => {
      Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({
        status: 'denied',
      });
      await expect(
        locationService.getAddressFromCoords(1, 2)
      ).resolves.toBeNull();

      granted();
      Location.reverseGeocodeAsync.mockResolvedValueOnce([]);
      await expect(
        locationService.getAddressFromCoords(1, 2)
      ).resolves.toBeNull();

      granted();
      Location.reverseGeocodeAsync.mockResolvedValueOnce([{}]);
      await expect(
        locationService.getAddressFromCoords(1, 2)
      ).resolves.toBeNull();

      granted();
      Location.reverseGeocodeAsync.mockRejectedValueOnce(new Error('falha'));
      await expect(
        locationService.getAddressFromCoords(1, 2)
      ).resolves.toBeNull();
    });
  });

  describe('getCoordsFromAddress', () => {
    it('deve converter o endereço em coordenadas', async () => {
      Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({
        status: 'granted',
      });
      Location.geocodeAsync.mockResolvedValueOnce([
        { latitude: -22.9, longitude: -43.2, accuracy: 10 },
      ]);

      await expect(
        locationService.getCoordsFromAddress('  Rua B, Rio  ')
      ).resolves.toEqual({ latitude: -22.9, longitude: -43.2 });
      expect(Location.geocodeAsync).toHaveBeenCalledWith('Rua B, Rio');
    });

    it('deve retornar null sem endereço, sem permissão, sem resultado ou com erro', async () => {
      await expect(
        locationService.getCoordsFromAddress('  ')
      ).resolves.toBeNull();
      await expect(
        locationService.getCoordsFromAddress(undefined)
      ).resolves.toBeNull();

      Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({
        status: 'denied',
      });
      await expect(
        locationService.getCoordsFromAddress('Rua B')
      ).resolves.toBeNull();

      Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({
        status: 'granted',
      });
      Location.geocodeAsync.mockResolvedValueOnce([]);
      await expect(
        locationService.getCoordsFromAddress('Rua B')
      ).resolves.toBeNull();

      Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({
        status: 'granted',
      });
      Location.geocodeAsync.mockRejectedValueOnce(new Error('falha'));
      await expect(
        locationService.getCoordsFromAddress('Rua B')
      ).resolves.toBeNull();
    });
  });
});
