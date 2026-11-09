import { useEffect, useState } from 'react';
import { guideService } from '../services/guideService';

export function useFeedGuide(usuario) {
  const [isGuideVisible, setIsGuideVisible] = useState(false);

  useEffect(() => {
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
    await guideService.markFeedGuideSeen(usuario).catch(() => undefined);
  };

  const showGuide = () => setIsGuideVisible(true);

  return { isGuideVisible, dismissGuide, showGuide };
}
