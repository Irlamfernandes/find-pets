import { locationService } from '../locationService';
import * as Location from 'expo-location';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

describe('locationService', () => {
  it('deve retornar as coordenadas formatadas quando a permissão for concedida', async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({
      status: 'granted',
    });
    Location.getCurrentPositionAsync.mockResolvedValueOnce({
      coords: { latitude: -22.5, longitude: -44.1 },
    });

    const result = await locationService.getCurrentLocation();
    expect(result).toBe('Lat: -22.5000, Lon: -44.1000');
  });

  it('deve retornar mensagem de negado se a permissão não for concedida', async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({
      status: 'denied',
    });

    const result = await locationService.getCurrentLocation();
    expect(result).toBe('Localização não permitida');
  });

  it('deve retornar indisponível se ocorrer um erro', async () => {
    Location.requestForegroundPermissionsAsync.mockRejectedValueOnce(
      new Error('Erro GPS')
    );

    const result = await locationService.getCurrentLocation();
    expect(result).toBe('Localização indisponível');
  });
});
