import { isUnauthorized, OfflineError } from '../../shared/firebase/remoteCall';
import { authApi } from '../auth/services/authApi';
import { sessionService } from '../auth/services/sessionService';
import { isOnline } from './connectivity';
import { pullPosts, pushPosts } from './postSync';
import { pullProfile, pushProfile } from './profileSync';

export const SYNC_RESULT = {
  SYNCED: 'synced',
  // Sem conta conectada, sem login no Firebase (entrou offline) ou sem
  // internet
  SKIPPED: 'skipped',
  OFFLINE: 'offline',
  // O Firebase recusou o login (expirou): é preciso entrar com a senha
  UNAUTHORIZED: 'unauthorized',
  FAILED: 'failed',
};

const listeners = new Set();

async function connectedAccount() {
  const usuario = await sessionService.getCurrentUser();
  const account = usuario ? await authApi.currentAccountOf(usuario) : null;
  return account && (await isOnline()) ? { usuario, uid: account.uid } : null;
}

// Envia primeiro (vale a alteração mais recente) e depois baixa as novidades
async function syncAccount({ usuario, uid }) {
  await pushProfile(uid, usuario);
  await pushPosts(uid, usuario);
  await pullProfile(uid, usuario);
  await pullPosts(usuario);
}

async function resultOfFailure(error) {
  if (isUnauthorized(error)) {
    await authApi.signOut();
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
    return account ? resultOfFailure(error) : SYNC_RESULT.FAILED;
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
