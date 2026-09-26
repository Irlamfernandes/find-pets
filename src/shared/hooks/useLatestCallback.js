import { useCallback, useLayoutEffect, useRef } from 'react';

// Devolve uma função estável que sempre chama a versão mais recente de
// `callback`. Útil em efeitos que devem rodar uma vez só, mas chamam funções
// recebidas por props (recriadas a cada render).
export function useLatestCallback(callback) {
  const callbackRef = useRef(callback);

  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback((...args) => callbackRef.current?.(...args), []);
}
