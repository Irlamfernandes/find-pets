import { randomUUID } from 'expo-crypto';

// Identificador único (UUID v4). Não se repete entre aparelhos, então os
// registros criados em celulares diferentes podem ir juntos para a nuvem.
export const createId = () => randomUUID();
