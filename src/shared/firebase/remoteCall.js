// Sem internet, o Firebase pode deixar a operação esperando até a conexão
// voltar. Depois deste tempo, ela é tratada como falta de conexão.
const TIMEOUT_MS = 15000;

// Não foi possível falar com o Firebase (sem internet). O app continua
// funcionando offline e tenta de novo depois.
export class OfflineError extends Error {
  // A mensagem padrão é a exibida quando a pessoa está sem internet
  constructor(message = 'Sem conexão com o servidor.') {
    super(message);
    this.name = 'OfflineError';
  }
}

// Texto do erro, mesmo quando ele não tem mensagem
const messageOf = (error) => String(error?.message ?? '');

// Falha por falta de conexão (no login ou no banco de dados)
const isNetworkFailure = (error) =>
  error?.code === 'auth/network-request-failed' ||
  /client is offline/i.test(messageOf(error));

// O Firebase recusou o acesso (login expirado ou sem permissão)
export const isUnauthorized = (error) =>
  error?.code === 'auth/user-token-expired' ||
  /permission.denied/i.test(messageOf(error));

// Executa uma operação do Firebase, convertendo falta de conexão (inclusive
// a demora demais) em OfflineError
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
