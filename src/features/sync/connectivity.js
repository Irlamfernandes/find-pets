import { addNetworkStateListener, getNetworkStateAsync } from 'expo-network';

const hasInternet = (state) =>
  Boolean(state.isConnected) && state.isInternetReachable !== false;

export async function isOnline() {
  return hasInternet(await getNetworkStateAsync());
}

export function onReconnect(callback) {
  let wasOnline = true;
  const subscription = addNetworkStateListener((state) => {
    const online = hasInternet(state);
    if (online && !wasOnline) callback();
    wasOnline = online;
  });
  return () => subscription.remove();
}
