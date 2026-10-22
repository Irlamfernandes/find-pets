import { useEffect, useState } from 'react';
import { guideService } from '../services/guideService';

// Mostra o guia do feed na primeira vez de cada conta
export function useFeedGuide(usuario) {
  const [isGuideVisible, setIsGuideVisible] = useState(false);

  useEffect(() => {
    // Aguarda saber quem é o usuário para não piscar o aviso à toa
    if (!usuario) return undefined;

    let active = true;
    guideService
      .hasSeenFeedGuide(usuario)
      .catch(() => false)
      .then((seen) => {
        if (active) setIsGuideVisible(!seen);
      });

    return () => {
      active = false;
    };
  }, [usuario]);

  // Fecha o guia e lembra que a conta já o viu
  const dismissGuide = async () => {
    setIsGuideVisible(false);
    try {
      await guideService.markFeedGuideSeen(usuario);
    } catch {
      // Se não conseguir salvar, o aviso só volta a aparecer na próxima vez
    }
  };

  // Abre o guia de novo pelo botão de ajuda
  const showGuide = () => setIsGuideVisible(true);

  return { isGuideVisible, dismissGuide, showGuide };
}
