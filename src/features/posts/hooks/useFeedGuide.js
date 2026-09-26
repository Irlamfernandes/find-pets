import { useEffect, useState } from 'react';
import { guideService } from '../services/guideService';

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

  const dismissGuide = async () => {
    setIsGuideVisible(false);
    try {
      await guideService.markFeedGuideSeen(usuario);
    } catch {
      // Se não conseguir salvar, o aviso só volta a aparecer na próxima vez
    }
  };

  const showGuide = () => setIsGuideVisible(true);

  return { isGuideVisible, dismissGuide, showGuide };
}
