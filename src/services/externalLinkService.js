// src/services/externalLinkService.js
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
    // Se não houver telefone cadastrado, encerra a execução para não abrir chat fictício
    if (!phoneNumber) {
      return;
    }

    const message = encodeURIComponent(
      'Olá! Vi seu post sobre o pet no Find Pets e gostaria de ajudar.'
    );
    Linking.openURL(`https://wa.me/${phoneNumber}?text=${message}`);
  },
};
