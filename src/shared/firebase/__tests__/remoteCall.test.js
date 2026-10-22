import { isUnauthorized, OfflineError, remoteCall } from '../remoteCall';

const withCode = (code) => Object.assign(new Error(code), { code });

describe('remoteCall', () => {
  afterEach(() => jest.useRealTimers());

  it('deve devolver o resultado da operação', async () => {
    await expect(remoteCall(async () => 'ok')).resolves.toBe('ok');
  });

  it.each([
    ['falha de rede no login', withCode('auth/network-request-failed')],
    ['banco sem conexão', new Error('Error: Client is offline.')],
  ])('deve tratar %s como falta de conexão', async (_case, error) => {
    await expect(
      remoteCall(() => Promise.reject(error))
    ).rejects.toBeInstanceOf(OfflineError);
  });

  it('deve repassar os outros erros', async () => {
    const error = withCode('auth/weak-password');

    await expect(remoteCall(() => Promise.reject(error))).rejects.toBe(error);
    await expect(remoteCall(() => Promise.reject())).rejects.toBeUndefined();
  });

  it('deve desistir quando o Firebase demora demais (sem internet)', async () => {
    jest.useFakeTimers();
    const call = remoteCall(() => new Promise(() => {}));
    jest.advanceTimersByTime(15000);

    await expect(call).rejects.toThrow('Sem conexão com o servidor.');
  });

  it('deve reconhecer quando o Firebase recusa o acesso', () => {
    expect(
      isUnauthorized(new Error('PERMISSION_DENIED: Permission denied'))
    ).toBe(true);
    expect(isUnauthorized(withCode('auth/user-token-expired'))).toBe(true);
    expect(isUnauthorized(new OfflineError())).toBe(false);
    expect(isUnauthorized(null)).toBe(false);
  });
});
