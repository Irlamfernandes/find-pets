import {
  isUnauthorized,
  OfflineError,
  SignInRequiredError,
} from '../../shared/firebase/remoteCall';
import { authApi } from '../auth/services/authApi';
import { sessionService } from '../auth/services/sessionService';
import { isOnline } from './connectivity';
import { pullPosts, pushPosts } from './postSync';
import { pullProfile, pushProfile } from './profileSync';

export const SYNC_RESULT = {
  SYNCED: 'synced',
  SKIPPED: 'skipped',
  OFFLINE: 'offline',
  UNAUTHORIZED: 'unauthorized',
  FAILED: 'failed',
};

const listeners = new Set();

async function connectedAccount() {
  const usuario = await sessionService.getCurrentUser();
  if (!usuario || !(await isOnline())) return null;
  const account = await authApi.currentAccountOf(usuario);
  if (!account) throw new SignInRequiredError();
  return { usuario, uid: account.uid };
}

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
  try {
    const account = await connectedAccount();
    if (!account) return SYNC_RESULT.SKIPPED;
    await syncAccount(account);
    return SYNC_RESULT.SYNCED;
  } catch (error) {
    return resultOfFailure(error);
  }
}

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

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
