import { useRef } from 'react';
import { useBusy } from '../components/BusyOverlay';

export function useSingleFlight(action) {
  const pendingRef = useRef(null);
  const track = useBusy();

  return (...args) => {
    if (pendingRef.current) return pendingRef.current;

    const result = action(...args);
    if (!result || typeof result.then !== 'function') return result;

    pendingRef.current = track(result).finally(() => {
      pendingRef.current = null;
    });
    return pendingRef.current;
  };
}
