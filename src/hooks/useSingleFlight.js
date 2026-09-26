import { useRef } from 'react';

// Garante que uma ação assíncrona rode uma vez por vez: chamadas feitas
// enquanto ela está em andamento (ex.: botão + tecla "concluir") recebem a
// mesma Promise em vez de disparar a ação de novo.
export function useSingleFlight(action) {
  const pendingRef = useRef(null);

  return (...args) => {
    if (pendingRef.current) return pendingRef.current;

    const result = action(...args);
    if (!result || typeof result.then !== 'function') return result;

    pendingRef.current = result.finally(() => {
      pendingRef.current = null;
    });
    return pendingRef.current;
  };
}
