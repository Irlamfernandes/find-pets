import { getRandomValues } from 'expo-crypto';

export function installRandomValues(target = globalThis) {
  if (typeof target.crypto?.getRandomValues === 'function') return;
  target.crypto = { ...target.crypto, getRandomValues };
}

installRandomValues();
