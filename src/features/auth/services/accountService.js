import bcrypt from 'bcryptjs';
import { STORAGE_KEYS } from '../../../shared/constants/storageKeys';
import {
  createJsonStore,
  secureStorageAdapter,
  withErrorContext,
} from '../../../shared/services/storage';

const BCRYPT_ROUNDS = 10;

// Contas deste aparelho: [{ usuario, passwordHash, hasBiometrics }].
// Ficam no armazenamento criptografado do sistema.
const accountsStore = createJsonStore(STORAGE_KEYS.CREDENTIALS, {
  adapter: secureStorageAdapter,
  fallback: [],
});

const findAccount = (accounts, usuario) =>
  accounts.find((account) => account.usuario === usuario) || null;

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  return bcrypt.hash(password, salt);
}

// Aplica `changes` à conta, que precisa existir
function updateAccount(usuario, changes) {
  return accountsStore.update((accounts) => {
    if (!findAccount(accounts, usuario)) {
      throw new Error('Conta não encontrada.');
    }
    return accounts.map((account) =>
      account.usuario === usuario ? { ...account, ...changes } : account
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

  // Cria a conta sem biometria (ela é ativada depois, no fim do cadastro ou
  // no Perfil). Recusa e-mails já cadastrados, o que trocaria a senha.
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
          { usuario, passwordHash, hasBiometrics: false },
        ]);
      }
    );
  },

  async changePassword(usuario, newPassword) {
    requireCredentials(usuario, newPassword);
    return withErrorContext('Erro ao alterar a senha', async () =>
      updateAccount(usuario, { passwordHash: await hashPassword(newPassword) })
    );
  },

  // true quando a senha confere com a da conta
  async checkPassword(usuario, password) {
    if (!usuario || !password) return false;
    const account = await this.getAccount(usuario);
    return account ? bcrypt.compare(password, account.passwordHash) : false;
  },

  // A biometria do aparelho fica vinculada a uma única conta: o sistema não
  // informa ao app qual digital/rosto foi usado, então não há como separar
  // biometrias de pessoas diferentes no mesmo celular.
  getBiometricOwner() {
    return withErrorContext('Erro ao verificar a biometria', async () => {
      const accounts = await accountsStore.read();
      return accounts.find((account) => account.hasBiometrics) || null;
    });
  },

  setBiometrics(usuario, enabled) {
    return withErrorContext('Erro ao atualizar a biometria', async () => {
      const owner = await this.getBiometricOwner();
      if (enabled && owner && owner.usuario !== usuario) {
        throw new Error('A biometria deste aparelho já está em uso.');
      }
      await updateAccount(usuario, { hasBiometrics: enabled });
    });
  },
};
