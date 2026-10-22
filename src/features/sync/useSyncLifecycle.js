import { useEffect } from 'react';
import { setSyncHandler } from '../../shared/services/syncScheduler';
import { useLatestCallback } from '../../shared/hooks/useLatestCallback';
import { onReconnect } from './connectivity';
import { SYNC_RESULT, syncService } from './syncService';

// Liga a sincronização enquanto o app está aberto: atende os pedidos feitos
// depois de cada alteração, sincroniza quando a internet volta e avisa
// quando o Firebase recusar o login (é preciso entrar com a senha).
export function useSyncLifecycle(onSessionExpired) {
  const handleSessionExpired = useLatestCallback(onSessionExpired);

  useEffect(() => {
    setSyncHandler(syncService.syncNow);
    const stopObserving = onReconnect(syncService.syncNow);
    const unsubscribe = syncService.subscribe((result) => {
      if (result === SYNC_RESULT.UNAUTHORIZED) handleSessionExpired();
    });

    return () => {
      setSyncHandler(null);
      stopObserving();
      unsubscribe();
    };
  }, [handleSessionExpired]);
}
