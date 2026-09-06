import * as Location from 'expo-location';

export const locationService = {
  async getCurrentLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return 'Localização não permitida';
      }

      const location = await Location.getCurrentPositionAsync({});
      return `Lat: ${location.coords.latitude.toFixed(4)}, Lon: ${location.coords.longitude.toFixed(4)}`;
    } catch {
      return 'Localização indisponível';
    }
  },
};
