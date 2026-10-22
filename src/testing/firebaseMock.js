// Firebase em memória para os testes. O SDK real fala com a nuvem; aqui o
// mesmo contrato (Authentication e Realtime Database) é atendido por um
// estado local, compartilhado pelos três módulos do pacote.

const backend = { users: [], tree: {}, clock: 0, sequence: 0 };
const auth = { currentUser: null, authStateReady: async () => {} };

const authError = (code) => Object.assign(new Error(code), { code });

const normalize = (email) => String(email).trim().toLowerCase();

const isEmpty = (value) =>
  value === null ||
  value === undefined ||
  (typeof value === 'object' && Object.keys(value).length === 0);

// Como no Firebase: nulos, listas e objetos vazios não são guardados, e
// undefined é recusado
function clean(value) {
  if (value === undefined) throw new Error('set failed: value is undefined');
  if (value?.['.sv'] === 'timestamp') return (backend.clock += 1);
  if (Array.isArray(value)) return value.map(clean);
  if (value === null || typeof value !== 'object') return value;
  const entries = Object.entries(value).filter(([, item]) => !isEmpty(item));
  return Object.fromEntries(entries.map(([key, item]) => [key, clean(item)]));
}

const keysOf = (path) => path.split('/').filter(Boolean);

function readPath(path) {
  return keysOf(path).reduce((node, key) => node?.[key] ?? null, backend.tree);
}

function writePath(path, value) {
  const keys = keysOf(path);
  const last = keys.pop();
  const parent = keys.reduce((node, key) => (node[key] ??= {}), backend.tree);
  parent[last] = value;
}

const copy = (value) => (value === null ? null : structuredClone(value));

function snapshotOf(value, children = []) {
  return {
    exists: () => !isEmpty(value),
    val: () => (isEmpty(value) ? null : copy(value)),
    forEach: (callback) =>
      children.some((child) => callback(snapshotOf(child)) === true),
  };
}

// Consulta com orderByChild + startAt (únicas usadas pelo app)
function runQuery({ path, constraints }) {
  const { key } = constraints.find((item) => item.type === 'orderByChild');
  const { value: start } = constraints.find((item) => item.type === 'startAt');
  const children = Object.values(readPath(path) ?? {})
    .filter((child) => child[key] >= start)
    .sort((a, b) => a[key] - b[key]);
  return snapshotOf(children, children);
}

const appModule = {
  initializeApp: jest.fn((config) => ({ config })),
};

const authModule = {
  initializeAuth: jest.fn(() => auth),
  getReactNativePersistence: jest.fn((storage) => ({ storage })),

  createUserWithEmailAndPassword: jest.fn(async (_auth, email, password) => {
    if (backend.users.some((user) => user.email === normalize(email))) {
      throw authError('auth/email-already-in-use');
    }
    if (password.length < 6) throw authError('auth/weak-password');
    backend.sequence += 1;
    const user = { uid: `uid-${backend.sequence}`, email: normalize(email) };
    backend.users.push({ ...user, password });
    auth.currentUser = user;
    return { user };
  }),

  signInWithEmailAndPassword: jest.fn(async (_auth, email, password) => {
    const found = backend.users.find(
      (user) => user.email === normalize(email) && user.password === password
    );
    if (!found) throw authError('auth/invalid-credential');
    auth.currentUser = { uid: found.uid, email: found.email };
    return { user: auth.currentUser };
  }),

  signOut: jest.fn(async () => {
    auth.currentUser = null;
  }),

  updatePassword: jest.fn(async (user, password) => {
    backend.users.find((item) => item.uid === user.uid).password = password;
  }),
};

const databaseModule = {
  getDatabase: jest.fn(() => ({})),
  ref: jest.fn((_database, path = '') => ({ path })),
  query: jest.fn((reference, ...constraints) => ({
    path: reference.path,
    constraints,
  })),
  orderByChild: jest.fn((key) => ({ type: 'orderByChild', key })),
  startAt: jest.fn((value) => ({ type: 'startAt', value })),
  serverTimestamp: jest.fn(() => ({ '.sv': 'timestamp' })),

  set: jest.fn(async (reference, value) => {
    writePath(reference.path, clean(value));
  }),

  get: jest.fn(async (target) =>
    target.constraints ? runQuery(target) : snapshotOf(readPath(target.path))
  ),
};

// Apaga contas, login e dados (cada teste começa do zero)
function resetFirebase() {
  backend.users = [];
  backend.tree = {};
  backend.clock = 0;
  backend.sequence = 0;
  auth.currentUser = null;
}

// Lê o banco direto, sem passar pelo app
const readFirebase = (path) => copy(readPath(path));

module.exports = {
  appModule,
  authModule,
  databaseModule,
  firebaseAuth: auth,
  resetFirebase,
  readFirebase,
};
