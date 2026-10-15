import { isUnauthorized, OfflineError } from '../../shared/api/httpClient';
import { sessionService } from '../auth/services/sessionService';
import { tokenStorage } from '../auth/services/tokenStorage';
import { isOnline } from './connectivity';
import { pullPosts, pushPosts } from './postSync';
import { pullProfile, pushProfile } from './profileSync';

export const SYNC_RESULT = {
  SYNCED: 'synced',
  // Sem conta conectada, sem token (entrou offline) ou sem internet
  SKIPPED: 'skipped',
  OFFLINE: 'offline',
  // O servidor recusou o token (expirou): é preciso entrar com a senha
  UNAUTHORIZED: 'unauthorized',
  FAILED: 'failed',
};

const listeners = new Set();

async function connectedAccount() {
  const usuario = await sessionService.getCurrentUser();
  const token = usuario ? await tokenStorage.get(usuario) : null;
  return token && (await isOnline()) ? { usuario, token } : null;
}

// Envia primeiro (o servidor decide conflitos) e depois baixa as novidades
async function syncAccount({ usuario, token }) {
  await pushProfile(token, usuario);
  await pushPosts(token);
  await pullProfile(token, usuario);
  await pullPosts(token, usuario);
}

async function resultOfFailure(error, account) {
  if (isUnauthorized(error)) {
    await tokenStorage.remove(account.usuario);
    return SYNC_RESULT.UNAUTHORIZED;
  }
  return error instanceof OfflineError
    ? SYNC_RESULT.OFFLINE
    : SYNC_RESULT.FAILED;
}

async function runSync() {
  let account = null;
  try {
    account = await connectedAccount();
    if (!account) return SYNC_RESULT.SKIPPED;
    await syncAccount(account);
    return SYNC_RESULT.SYNCED;
  } catch (error) {
    return account ? resultOfFailure(error, account) : SYNC_RESULT.FAILED;
  }
}

// Uma sincronização por vez. Pedidos feitos durante uma sincronização (ex.:
// o usuário salvou algo) fazem ela rodar de novo ao terminar.
let running = null;
let requestedAgain = false;

async function runUntilDone() {
  let result;
  do {
    requestedAgain = false;
    result = await runSync();
    listeners.forEach((listener) => listener(result));
  } while (requestedAgain);
  return result;
}

export const syncService = {
  // Devolve um SYNC_RESULT; nunca lança erro
  syncNow() {
    if (running) {
      requestedAgain = true;
      return running;
    }
    running = runUntilDone().finally(() => {
      running = null;
    });
    return running;
  },

  // Avisa a cada sincronização terminada; devolve a função que cancela
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
