import { getRandomValues } from 'expo-crypto';
import { installRandomValues } from '../randomValues';

describe('installRandomValues', () => {
  it('deve usar o gerador do expo-crypto quando o motor não tiver um', () => {
    const target = { crypto: { subtle: 'mantido' } };

    installRandomValues(target);

    expect(target.crypto.getRandomValues).toBe(getRandomValues);
    expect(target.crypto.subtle).toBe('mantido');

    const empty = {};
    installRandomValues(empty);
    expect(empty.crypto.getRandomValues).toBe(getRandomValues);
  });

  it('deve manter o gerador que o motor já oferece', () => {
    const own = jest.fn();
    const target = { crypto: { getRandomValues: own } };

    installRandomValues(target);

    expect(target.crypto.getRandomValues).toBe(own);
  });
});
