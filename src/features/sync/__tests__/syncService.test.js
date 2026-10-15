import { SYNC_RESULT, syncService } from '../syncService';
import { pullPosts, pushPosts } from '../postSync';
import { pullProfile, pushProfile } from '../profileSync';
import { isOnline } from '../connectivity';
import { sessionService } from '../../auth/services/sessionService';
import { tokenStorage } from '../../auth/services/tokenStorage';
import { HttpError, OfflineError } from '../../../shared/api/httpClient';

jest.mock('../postSync');
jest.mock('../profileSync');
jest.mock('../connectivity');
jest.mock('../../auth/services/sessionService');
jest.mock('../../auth/services/tokenStorage');

describe('syncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionService.getCurrentUser.mockResolvedValue('ana@x.com');
    tokenStorage.get.mockResolvedValue('token-ana');
    isOnline.mockResolvedValue(true);
    [pushProfile, pushPosts, pullProfile, pullPosts].forEach((step) =>
      step.mockResolvedValue()
    );
  });

  it('deve enviar primeiro e depois baixar as novidades', async () => {
    const order = [];
    pushProfile.mockImplementation(async () => order.push('pushProfile'));
    pushPosts.mockImplementation(async () => order.push('pushPosts'));
    pullProfile.mockImplementation(async () => order.push('pullProfile'));
    pullPosts.mockImplementation(async () => order.push('pullPosts'));

    await expect(syncService.syncNow()).resolves.toBe(SYNC_RESULT.SYNCED);

    expect(order).toEqual([
      'pushProfile',
      'pushPosts',
      'pullProfile',
      'pullPosts',
    ]);
    expect(pushProfile).toHaveBeenCalledWith('token-ana', 'ana@x.com');
    expect(pullPosts).toHaveBeenCalledWith('token-ana', 'ana@x.com');
  });

  it.each([
    [
      'sem conta conectada',
      () => sessionService.getCurrentUser.mockResolvedValue(null),
    ],
    [
      'sem token (entrou offline)',
      () => tokenStorage.get.mockResolvedValue(null),
    ],
    ['sem internet', () => isOnline.mockResolvedValue(false)],
  ])('não deve sincronizar %s', async (_case, arrange) => {
    arrange();

    await expect(syncService.syncNow()).resolves.toBe(SYNC_RESULT.SKIPPED);
    expect(pushProfile).not.toHaveBeenCalled();
  });

  it('deve esquecer o token recusado pelo servidor', async () => {
    pushPosts.mockRejectedValue(new HttpError(401, 'Expirou.'));

    await expect(syncService.syncNow()).resolves.toBe(SYNC_RESULT.UNAUTHORIZED);
    expect(tokenStorage.remove).toHaveBeenCalledWith('ana@x.com');
  });

  it('deve informar falta de conexão e outras falhas sem lançar erro', async () => {
    pushPosts.mockRejectedValueOnce(new OfflineError());
    await expect(syncService.syncNow()).resolves.toBe(SYNC_RESULT.OFFLINE);

    pushPosts.mockRejectedValueOnce(new Error('disco cheio'));
    await expect(syncService.syncNow()).resolves.toBe(SYNC_RESULT.FAILED);

    sessionService.getCurrentUser.mockRejectedValueOnce(new Error('x'));
    await expect(syncService.syncNow()).resolves.toBe(SYNC_RESULT.FAILED);
    expect(tokenStorage.remove).not.toHaveBeenCalled();
  });

  it('deve rodar uma por vez e repetir se houve pedido no meio', async () => {
    let finishFirst;
    pushProfile.mockImplementationOnce(
      () => new Promise((resolve) => (finishFirst = resolve))
    );

    const first = syncService.syncNow();
    await Promise.resolve();
    const second = syncService.syncNow();
    const third = syncService.syncNow();
    expect(second).toBe(first);
    expect(third).toBe(first);

    await new Promise((resolve) => setImmediate(resolve));
    finishFirst();
    await first;

    // A primeira rodada mais uma repetição (os dois pedidos viram um só)
    expect(pushProfile).toHaveBeenCalledTimes(2);
  });

  it('deve avisar quem acompanha cada sincronização', async () => {
    const listener = jest.fn();
    const unsubscribe = syncService.subscribe(listener);

    await syncService.syncNow();
    unsubscribe();
    await syncService.syncNow();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(SYNC_RESULT.SYNCED);
  });
});
