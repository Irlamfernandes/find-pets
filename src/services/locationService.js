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
  // Converte coordenadas em um endereço legível (ex.: "Rua X, 10 - Bairro, Cidade")
  async getAddressFromCoords(latitude, longitude) {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;

      const [place] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      if (!place) return null;
      if (place.formattedAddress) return place.formattedAddress;

      const street = [place.street, place.streetNumber]
        .filter(Boolean)
        .join(', ');
      const address = [street, place.district, place.city]
        .filter(Boolean)
        .join(' - ');
      return address || null;
    } catch {
      return null;
    }
  },

  // Converte um endereço digitado em coordenadas
  async getCoordsFromAddress(address) {
    if (!address?.trim()) return null;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;

      const [result] = await Location.geocodeAsync(address.trim());
      return result
        ? { latitude: result.latitude, longitude: result.longitude }
        : null;
    } catch {
      return null;
    }
  },
};
