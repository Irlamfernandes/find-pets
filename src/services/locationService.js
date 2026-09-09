import * as Location from 'expo-location';

export const locationService = {
  async getCurrentLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return {
          latitude: null,
          longitude: null,
          address: 'Localização não permitida',
        };
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      return {
        latitude,
        longitude,
        address: `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`,
      };
    } catch {
      return {
        latitude: null,
        longitude: null,
        address: 'Localização indisponível',
      };
    }
  },
};
