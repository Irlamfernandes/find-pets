// src/services/externalLinkService.js
import { Linking, Platform } from 'react-native';
import { onlyDigits } from '../utils/phoneMask';

// iOS abre o Apple Maps (sempre instalado); Android abre o Google Maps.
// O destino já vai preenchido e o app de mapas calcula a rota a partir da posição atual.
export function buildRouteUrl(latitude, longitude, os) {
  if (os === 'ios') {
    return `http://maps.apple.com/?daddr=${latitude},${longitude}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

export const externalLinkService = {
  // O wa.me só aceita dígitos (com o código do país, como o número é gravado)
  openWhatsApp(phoneNumber) {
    const digits = onlyDigits(phoneNumber);
    // Sem telefone, não abre um chat fictício
    if (!digits) {
      return;
    }

    const message = encodeURIComponent(
      'Olá! Vi seu post sobre o pet no FindPets e gostaria de ajudar.'
    );
    Linking.openURL(`https://wa.me/${digits}?text=${message}`);
  },

  // Abre o app de mapas com a rota até as coordenadas (ignora valores inválidos)
  openRoute(latitude, longitude) {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return;
    }
    Linking.openURL(buildRouteUrl(latitude, longitude, Platform.OS));
  },
};
