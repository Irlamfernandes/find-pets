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

const SERVER_TIME_FIELD = 'serverUpdatedAt';

export async function readValue(path) {
  const snapshot = await remoteCall(() => get(ref(database, path)));
  return snapshot.exists() ? snapshot.val() : null;
}

export function writeValue(path, value) {
  return remoteCall(() =>
    set(ref(database, path), {
      ...value,
      [SERVER_TIME_FIELD]: serverTimestamp(),
    })
  );
}

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
