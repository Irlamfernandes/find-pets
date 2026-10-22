import {
  get,
  orderByChild,
  query,
  ref,
  serverTimestamp,
  set,
  startAt,
} from 'firebase/database';
import { database } from './firebaseApp';
import { remoteCall } from './remoteCall';

// Hora do servidor da última gravação: permite baixar só o que mudou, sem
// depender do relógio do celular
const SERVER_TIME_FIELD = 'serverUpdatedAt';

// Valor guardado em `path`, ou null
export async function readValue(path) {
  const snapshot = await remoteCall(() => get(ref(database, path)));
  return snapshot.exists() ? snapshot.val() : null;
}

// Grava (ou substitui) o valor em `path`, com a hora do servidor
export function writeValue(path, value) {
  return remoteCall(() =>
    set(ref(database, path), {
      ...value,
      [SERVER_TIME_FIELD]: serverTimestamp(),
    })
  );
}

// Itens de `path` gravados a partir de `since` (hora do servidor, em ms),
// do mais antigo para o mais novo
export async function readChangedSince(path, since) {
  const changed = query(
    ref(database, path),
    orderByChild(SERVER_TIME_FIELD),
    startAt(since)
  );
  const snapshot = await remoteCall(() => get(changed));
  const values = [];
  snapshot.forEach((child) => {
    values.push(child.val());
  });
  return values;
}
