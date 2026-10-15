import NetInfo from '@react-native-community/netinfo';

// Conectado a uma rede que tem acesso à internet (quando o sistema ainda não
// sabe se há acesso, considera que sim e a requisição confirma)
const hasInternet = (state) =>
  Boolean(state.isConnected) && state.isInternetReachable !== false;

export async function isOnline() {
  return hasInternet(await NetInfo.fetch());
}

// Chama `callback` sempre que a internet volta. Devolve a função que para
// de observar.
export function onReconnect(callback) {
  let wasOnline = true;
  return NetInfo.addEventListener((state) => {
    const online = hasInternet(state);
    if (online && !wasOnline) callback();
    wasOnline = online;
  });
}
