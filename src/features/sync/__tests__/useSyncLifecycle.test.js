import { renderHook } from '@testing-library/react-native';
import { useSyncLifecycle } from '../useSyncLifecycle';
import { SYNC_RESULT, syncService } from '../syncService';
import { onReconnect } from '../connectivity';
import {
  requestSync,
  setSyncHandler,
} from '../../../shared/services/syncScheduler';

jest.mock('../connectivity');
jest.mock('../syncService', () => ({
  SYNC_RESULT: jest.requireActual('../syncService').SYNC_RESULT,
  syncService: { syncNow: jest.fn(), subscribe: jest.fn() },
}));
jest.mock('../../../shared/services/syncScheduler', () => {
  const actual = jest.requireActual('../../../shared/services/syncScheduler');
  return { ...actual, setSyncHandler: jest.fn(actual.setSyncHandler) };
});

describe('useSyncLifecycle', () => {
  const stopObserving = jest.fn();
  const unsubscribe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    onReconnect.mockReturnValue(stopObserving);
    syncService.subscribe.mockReturnValue(unsubscribe);
  });

  it('deve atender os pedidos de sincronização e sincronizar ao reconectar', () => {
    const { unmount } = renderHook(() => useSyncLifecycle(jest.fn()));

    requestSync();
    expect(syncService.syncNow).toHaveBeenCalledTimes(1);
    expect(onReconnect).toHaveBeenCalledWith(syncService.syncNow);

    unmount();
    requestSync();
    expect(syncService.syncNow).toHaveBeenCalledTimes(1);
    expect(setSyncHandler).toHaveBeenLastCalledWith(null);
    expect(stopObserving).toHaveBeenCalled();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('deve avisar só quando o servidor recusar o token', () => {
    const onSessionExpired = jest.fn();
    renderHook(() => useSyncLifecycle(onSessionExpired));
    const listener = syncService.subscribe.mock.calls[0][0];

    listener(SYNC_RESULT.SYNCED);
    listener(SYNC_RESULT.OFFLINE);
    expect(onSessionExpired).not.toHaveBeenCalled();

    listener(SYNC_RESULT.UNAUTHORIZED);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });
});
