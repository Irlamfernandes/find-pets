import { Linking } from 'react-native';

export const externalLinkService = {
  openMap(latitude, longitude, address) {
    let url = '';
    if (latitude && longitude) {
      url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    } else if (address) {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    } else {
      return;
    }
    Linking.openURL(url);
  },

  openWhatsApp(phoneNumber) {
    const targetPhone = phoneNumber || '5500000000000';
    const message = encodeURIComponent(
      'Olá! Vi seu post sobre o pet no Find Pets e gostaria de ajudar.'
    );
    Linking.openURL(`https://wa.me/${targetPhone}?text=${message}`);
  },
};
