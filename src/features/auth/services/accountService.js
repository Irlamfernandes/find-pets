import bcrypt from 'bcryptjs';
import { STORAGE_KEYS } from '../../../shared/constants/storageKeys';
import {
  createJsonStore,
  secureStorageAdapter,
  withErrorContext,
} from '../../../shared/services/storage';
import { normalizeEmail } from '../../../shared/utils/validation';

const BCRYPT_ROUNDS = 10;

const isValidAccount = (account) =>
  typeof account?.usuario === 'string' &&
  typeof account.passwordHash === 'string';

const accountsStore = createJsonStore(STORAGE_KEYS.CREDENTIALS, {
  adapter: secureStorageAdapter,
  fallback: [],
  normalize: (accounts) => accounts.filter(isValidAccount),
});

const sameUser = (account, usuario) =>
  normalizeEmail(account.usuario) === normalizeEmail(usuario);

const findAccount = (accounts, usuario) =>
  accounts.find((account) => sameUser(account, usuario)) || null;

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  return bcrypt.hash(password, salt);
}

function updateAccount(usuario, changes) {
  return accountsStore.update((accounts) => {
    if (!findAccount(accounts, usuario)) {
      throw new Error('Conta não encontrada.');
    }
    return accounts.map((account) =>
      sameUser(account, usuario) ? { ...account, ...changes } : account
    );
  });
}

function requireCredentials(usuario, password) {
  if (!usuario || !password) {
    throw new Error('Usuário e senha são obrigatórios.');
  }
}

export const accountService = {
  getAccount(usuario) {
    return withErrorContext('Erro ao recuperar credenciais', async () =>
      findAccount(await accountsStore.read(), usuario)
    );
  },

  async createAccount(usuario, password) {
    requireCredentials(usuario, password);
    if (await this.getAccount(usuario)) {
      throw new Error('Este e-mail já está cadastrado. Faça login.');
    }
    return withErrorContext(
      'Erro ao salvar credenciais com segurança',
      async () => {
        const passwordHash = await hashPassword(password);
        await accountsStore.update((accounts) => [
          ...accounts,
          {
            usuario: normalizeEmail(usuario),
            passwordHash,
            hasBiometrics: false,
          },
        ]);
      }
    );
  },

  async rememberAccount(usuario, password) {
    const account = await this.getAccount(usuario);
    return account
      ? this.changePassword(usuario, password)
      : this.createAccount(usuario, password);
  },

  async changePassword(usuario, newPassword) {
    requireCredentials(usuario, newPassword);
    return withErrorContext('Erro ao alterar a senha', async () =>
      updateAccount(usuario, { passwordHash: await hashPassword(newPassword) })
    );
  },

  async authenticate(usuario, password) {
    if (!usuario || !password) return null;
    const account = await this.getAccount(usuario);
    const isValid =
      account && (await bcrypt.compare(password, account.passwordHash));
    return isValid ? account.usuario : null;
  },

  async checkPassword(usuario, password) {
    return (await this.authenticate(usuario, password)) !== null;
  },

  getBiometricOwner() {
    return withErrorContext('Erro ao verificar a biometria', async () => {
      const accounts = await accountsStore.read();
      return accounts.find((account) => account.hasBiometrics) || null;
    });
  },

  setBiometrics(usuario, enabled) {
    return withErrorContext('Erro ao atualizar a biometria', async () => {
      const owner = await this.getBiometricOwner();
      if (enabled && owner && !sameUser(owner, usuario)) {
        throw new Error('A biometria deste aparelho já está em uso.');
      }
      await updateAccount(usuario, { hasBiometrics: enabled });
    });
  },
};
