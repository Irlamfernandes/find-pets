import { getRandomValues } from 'expo-crypto';

// O bcryptjs gera o sal da senha com crypto.getRandomValues, que o motor
// JavaScript do app (Hermes) não oferece: usa o gerador seguro do expo-crypto
export function installRandomValues(target = globalThis) {
  if (typeof target.crypto?.getRandomValues === 'function') return;
  target.crypto = { ...target.crypto, getRandomValues };
}

installRandomValues();
