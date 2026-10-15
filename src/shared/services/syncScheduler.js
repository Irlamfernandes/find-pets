// Ponte entre quem altera dados e a sincronização: os serviços pedem uma
// sincronização depois de cada alteração, sem precisar conhecê-la (o app
// registra quem atende o pedido ao abrir).
let handler = null;

export function setSyncHandler(syncNow) {
  handler = syncNow;
}

// Pede uma sincronização sem esperar por ela
export function requestSync() {
  handler?.();
}
