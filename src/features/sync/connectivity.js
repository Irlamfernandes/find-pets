import { addNetworkStateListener, getNetworkStateAsync } from 'expo-network';

// Conectado a uma rede que tem acesso à internet (quando o sistema ainda não
// sabe se há acesso, considera que sim e a requisição confirma)
const hasInternet = (state) =>
  Boolean(state.isConnected) && state.isInternetReachable !== false;

// true quando há rede com acesso à internet
export async function isOnline() {
  return hasInternet(await getNetworkStateAsync());
}

// Chama `callback` sempre que a internet volta. Devolve a função que para
// de observar.
export function onReconnect(callback) {
  let wasOnline = true;
  const subscription = addNetworkStateListener((state) => {
    const online = hasInternet(state);
    if (online && !wasOnline) callback();
    wasOnline = online;
  });
  return () => subscription.remove();
}
