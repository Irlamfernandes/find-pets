import { Linking, Platform } from 'react-native';
import { onlyDigits } from '../utils/phoneMask';

export function buildRouteUrl(latitude, longitude, os) {
  if (os === 'ios') {
    return `http://maps.apple.com/?daddr=${latitude},${longitude}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

export const externalLinkService = {
  openWhatsApp(phoneNumber) {
    const digits = onlyDigits(phoneNumber);
    if (!digits) {
      return;
    }

    const message = encodeURIComponent(
      'Olá! Vi seu post sobre o pet no FindPets e gostaria de ajudar.'
    );
    Linking.openURL(`https://wa.me/${digits}?text=${message}`);
  },

  openRoute(latitude, longitude) {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return;
    }
    Linking.openURL(buildRouteUrl(latitude, longitude, Platform.OS));
  },
};
