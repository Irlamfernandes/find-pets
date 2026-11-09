const TIMEOUT_MS = 15000;

export class OfflineError extends Error {
  constructor(message = 'Sem conexão com o servidor.') {
    super(message);
    this.name = 'OfflineError';
  }
}

export class SignInRequiredError extends Error {
  constructor() {
    super('Entre com sua senha para sincronizar.');
    this.name = 'SignInRequiredError';
  }
}

const messageOf = (error) => String(error?.message ?? '');

const isNetworkFailure = (error) =>
  error?.code === 'auth/network-request-failed' ||
  /client is offline/i.test(messageOf(error));

export const isUnauthorized = (error) =>
  error instanceof SignInRequiredError ||
  error?.code === 'auth/user-token-expired' ||
  /permission.denied/i.test(messageOf(error));

export async function remoteCall(operation) {
  let timer;
  const timeout = new Promise((_resolve, reject) => {
    timer = setTimeout(() => reject(new OfflineError()), TIMEOUT_MS);
  });
  try {
    return await Promise.race([operation(), timeout]);
  } catch (error) {
    throw isNetworkFailure(error) ? new OfflineError() : error;
  } finally {
    clearTimeout(timer);
  }
}
