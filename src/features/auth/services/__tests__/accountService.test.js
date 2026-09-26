import * as SecureStore from 'expo-secure-store';
import bcrypt from 'bcryptjs';
import { accountService } from '../accountService';
import { STORAGE_KEYS } from '../../../../shared/constants/storageKeys';

jest.mock('expo-secure-store', () =>
  require('../../../../testing/memoryStorage').createSecureStoreMock()
);

// Hash previsível: "hash:<senha>"
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn(async (password) => `hash:${password}`),
  compare: jest.fn(async (password, hash) => hash === `hash:${password}`),
}));

const storedAccounts = () =>
  JSON.parse(SecureStore.__backend.data.get(STORAGE_KEYS.CREDENTIALS));

describe('accountService', () => {
  beforeEach(() => {
    SecureStore.__backend.reset();
    jest.clearAllMocks();
  });

  describe('createAccount', () => {
    it('deve criar a conta com a senha criptografada e sem biometria', async () => {
      await accountService.createAccount('ana@x.com', '123456');

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(storedAccounts()).toEqual([
        {
          usuario: 'ana@x.com',
          passwordHash: 'hash:123456',
          hasBiometrics: false,
        },
      ]);
    });

    it('deve manter as contas existentes ao criar outra', async () => {
      await accountService.createAccount('ana@x.com', '1');
      await accountService.createAccount('bia@x.com', '2');

      expect(storedAccounts().map((account) => account.usuario)).toEqual([
        'ana@x.com',
        'bia@x.com',
      ]);
    });

    it('deve exigir usuário e senha', async () => {
      await expect(accountService.createAccount('', '1')).rejects.toThrow(
        'Usuário e senha são obrigatórios.'
      );
      await expect(
        accountService.createAccount('ana@x.com', '')
      ).rejects.toThrow('Usuário e senha são obrigatórios.');
    });

    it('deve recusar um e-mail já cadastrado', async () => {
      await accountService.createAccount('ana@x.com', '1');

      await expect(
        accountService.createAccount('ana@x.com', '2')
      ).rejects.toThrow('Este e-mail já está cadastrado. Faça login.');
    });

    it('deve informar a falha ao gravar', async () => {
      SecureStore.setItemAsync.mockRejectedValueOnce(new Error('disco cheio'));

      await expect(
        accountService.createAccount('ana@x.com', '1')
      ).rejects.toThrow(
        'Erro ao salvar credenciais com segurança: disco cheio'
      );
    });
  });

  describe('getAccount', () => {
    it('deve devolver a conta ou null', async () => {
      await accountService.createAccount('ana@x.com', '1');

      await expect(accountService.getAccount('ana@x.com')).resolves.toEqual(
        expect.objectContaining({ usuario: 'ana@x.com' })
      );
      await expect(accountService.getAccount('bia@x.com')).resolves.toBeNull();
    });

    it('deve informar a falha ao ler', async () => {
      SecureStore.getItemAsync.mockRejectedValueOnce(new Error('bloqueado'));

      await expect(accountService.getAccount('ana@x.com')).rejects.toThrow(
        'Erro ao recuperar credenciais: bloqueado'
      );
    });
  });

  describe('checkPassword', () => {
    beforeEach(() => accountService.createAccount('ana@x.com', 'certa'));

    it('deve confirmar apenas a senha correta da conta', async () => {
      await expect(
        accountService.checkPassword('ana@x.com', 'certa')
      ).resolves.toBe(true);
      await expect(
        accountService.checkPassword('ana@x.com', 'errada')
      ).resolves.toBe(false);
    });

    it('deve recusar conta inexistente ou dados vazios', async () => {
      await expect(
        accountService.checkPassword('bia@x.com', 'certa')
      ).resolves.toBe(false);
      await expect(accountService.checkPassword('', 'certa')).resolves.toBe(
        false
      );
      await expect(accountService.checkPassword('ana@x.com', '')).resolves.toBe(
        false
      );
    });
  });

  describe('e-mails com maiúsculas e senhas com espaços', () => {
    it('deve tratar o e-mail sem diferenciar maiúsculas', async () => {
      await accountService.createAccount(' Ana@X.com ', 'abc');

      expect(storedAccounts()[0].usuario).toBe('ana@x.com');
      await expect(
        accountService.authenticate('ANA@x.COM', 'abc')
      ).resolves.toBe('ana@x.com');
      await expect(
        accountService.createAccount('ana@x.com', 'outra')
      ).rejects.toThrow('Este e-mail já está cadastrado. Faça login.');
    });

    it('deve reconhecer contas antigas gravadas com maiúsculas', async () => {
      SecureStore.__backend.data.set(
        STORAGE_KEYS.CREDENTIALS,
        JSON.stringify([
          {
            usuario: 'Ana@X.com',
            passwordHash: 'hash:abc',
            hasBiometrics: false,
          },
        ])
      );

      await expect(
        accountService.authenticate('ana@x.com', 'abc')
      ).resolves.toBe('Ana@X.com');
      await accountService.setBiometrics('ana@x.com', true);
      await expect(accountService.getBiometricOwner()).resolves.toEqual(
        expect.objectContaining({ usuario: 'Ana@X.com' })
      );
      await expect(
        accountService.setBiometrics('ANA@x.com', true)
      ).resolves.toBeUndefined();
    });

    it('deve comparar a senha exatamente como foi digitada', async () => {
      await accountService.createAccount('ana@x.com', ' abc ');

      await expect(
        accountService.checkPassword('ana@x.com', ' abc ')
      ).resolves.toBe(true);
      await expect(
        accountService.checkPassword('ana@x.com', 'abc')
      ).resolves.toBe(false);
    });

    it('deve ignorar contas corrompidas', async () => {
      SecureStore.__backend.data.set(
        STORAGE_KEYS.CREDENTIALS,
        JSON.stringify([null, { usuario: 'sem-senha@x.com' }])
      );

      await expect(accountService.getAccount('sem-senha@x.com')).resolves.toBe(
        null
      );
      await accountService.createAccount('sem-senha@x.com', 'nova');
      await expect(
        accountService.checkPassword('sem-senha@x.com', 'nova')
      ).resolves.toBe(true);
    });
  });

  describe('changePassword', () => {
    it('deve trocar a senha mantendo a biometria', async () => {
      await accountService.createAccount('ana@x.com', 'antiga');
      await accountService.setBiometrics('ana@x.com', true);

      await accountService.changePassword('ana@x.com', 'nova');

      expect(storedAccounts()).toEqual([
        {
          usuario: 'ana@x.com',
          passwordHash: 'hash:nova',
          hasBiometrics: true,
        },
      ]);
    });

    it('deve exigir a nova senha e uma conta existente', async () => {
      await expect(
        accountService.changePassword('ana@x.com', '')
      ).rejects.toThrow('Usuário e senha são obrigatórios.');
      await expect(
        accountService.changePassword('ana@x.com', 'nova')
      ).rejects.toThrow('Erro ao alterar a senha: Conta não encontrada.');
    });
  });

  describe('biometria', () => {
    beforeEach(async () => {
      await accountService.createAccount('ana@x.com', '1');
      await accountService.createAccount('bia@x.com', '2');
    });

    it('deve ativar para uma conta e informá-la como dona', async () => {
      await expect(accountService.getBiometricOwner()).resolves.toBeNull();

      await accountService.setBiometrics('ana@x.com', true);

      await expect(accountService.getBiometricOwner()).resolves.toEqual(
        expect.objectContaining({ usuario: 'ana@x.com' })
      );
    });

    it('deve impedir que outra conta ative a biometria já em uso', async () => {
      await accountService.setBiometrics('ana@x.com', true);

      await expect(
        accountService.setBiometrics('bia@x.com', true)
      ).rejects.toThrow(
        'Erro ao atualizar a biometria: A biometria deste aparelho já está em uso.'
      );
    });

    it('deve permitir reativar, desativar e depois ativar em outra conta', async () => {
      await accountService.setBiometrics('ana@x.com', true);
      await accountService.setBiometrics('ana@x.com', true);
      await accountService.setBiometrics('bia@x.com', false);
      await accountService.setBiometrics('ana@x.com', false);
      await accountService.setBiometrics('bia@x.com', true);

      await expect(accountService.getBiometricOwner()).resolves.toEqual(
        expect.objectContaining({ usuario: 'bia@x.com' })
      );
    });

    it('deve recusar uma conta inexistente', async () => {
      await expect(
        accountService.setBiometrics('caio@x.com', true)
      ).rejects.toThrow('Erro ao atualizar a biometria: Conta não encontrada.');
    });

    it('deve informar a falha ao ler a dona da biometria', async () => {
      SecureStore.getItemAsync.mockRejectedValueOnce(new Error('bloqueado'));

      await expect(accountService.getBiometricOwner()).rejects.toThrow(
        'Erro ao verificar a biometria: bloqueado'
      );
    });
  });
});
