let handler = null;

export function setSyncHandler(syncNow) {
  handler = syncNow;
}

export function requestSync() {
  handler?.();
}
