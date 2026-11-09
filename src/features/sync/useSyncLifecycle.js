import { useEffect } from 'react';
import { setSyncHandler } from '../../shared/services/syncScheduler';
import { useLatestCallback } from '../../shared/hooks/useLatestCallback';
import { onReconnect } from './connectivity';
import { SYNC_RESULT, syncService } from './syncService';

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
