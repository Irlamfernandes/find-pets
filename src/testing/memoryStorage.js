// Armazenamento em memória para testes de serviços. Substitui o AsyncStorage
// e o SecureStore com o mesmo contrato, permitindo testar o comportamento
// (o que foi gravado e lido) sem depender do formato exato das chamadas.
function createMemoryBackend() {
  const data = new Map();
  return {
    data,
    get: jest.fn(async (key) => (data.has(key) ? data.get(key) : null)),
    set: jest.fn(async (key, value) => {
      data.set(key, value);
    }),
    remove: jest.fn(async (key) => {
      data.delete(key);
    }),
    reset() {
      data.clear();
    },
  };
}

export function createAsyncStorageMock() {
  const backend = createMemoryBackend();
  return {
    getItem: backend.get,
    setItem: backend.set,
    removeItem: backend.remove,
    __backend: backend,
  };
}

export function createSecureStoreMock() {
  const backend = createMemoryBackend();
  return {
    getItemAsync: backend.get,
    setItemAsync: backend.set,
    deleteItemAsync: backend.remove,
    __backend: backend,
  };
}
