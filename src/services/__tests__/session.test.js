// src/services/__tests__/session.test.js
import { sessionService } from '../session';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock do AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('sessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- CREDENCIAIS ---
  it('deve lançar erro se tentar salvar credenciais sem e-mail ou senha', async () => {
    await expect(sessionService.saveCredentials('', '123')).rejects.toThrow(
      'E-mail e senha são obrigatórios.'
    );
    await expect(
      sessionService.saveCredentials('teste@test.com', '')
    ).rejects.toThrow('E-mail e senha são obrigatórios.');
  });

  it('deve salvar as credenciais com sucesso', async () => {
    AsyncStorage.setItem.mockResolvedValueOnce();

    await expect(
      sessionService.saveCredentials('teste@test.com', '123456', true)
    ).resolves.toBeUndefined();

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.CREDENTIALS,
      JSON.stringify({
        email: 'teste@test.com',
        password: '123456',
        hasBiometrics: true,
      })
    );
  });

  it('deve lançar erro ao falhar ao salvar credenciais', async () => {
    AsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));

    await expect(
      sessionService.saveCredentials('teste@test.com', '123456')
    ).rejects.toThrow('Erro ao salvar credenciais: Storage error');
  });

  it('deve retornar as credenciais quando elas existirem', async () => {
    const creds = {
      email: 'teste@test.com',
      password: '123456',
      hasBiometrics: false,
    };
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(creds));

    const result = await sessionService.getCredentials();
    expect(result).toEqual(creds);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.CREDENTIALS);
  });

  it('deve retornar null se não houver credenciais salvas', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);

    const result = await sessionService.getCredentials();
    expect(result).toBeNull();
  });

  it('deve lançar erro caso ocorra exceção ao buscar as credenciais', async () => {
    AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

    await expect(sessionService.getCredentials()).rejects.toThrow(
      'Erro ao recuperar credenciais: Storage error'
    );
  });

  // --- SESSÃO ---
  it('deve lançar erro se tentar salvar sessão com dados inválidos', async () => {
    await expect(sessionService.saveSession(null)).rejects.toThrow(
      'Dados de sessão inválidos.'
    );
  });

  it('deve salvar a sessão com sucesso', async () => {
    AsyncStorage.setItem.mockResolvedValueOnce();

    const userData = { type: 'biometric', email: 'teste@test.com' };
    await expect(sessionService.saveSession(userData)).resolves.toBeUndefined();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.SESSION,
      JSON.stringify(userData)
    );
  });

  it('deve lançar erro ao falhar ao salvar a sessão', async () => {
    AsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));

    const userData = { type: 'biometric' };
    await expect(sessionService.saveSession(userData)).rejects.toThrow(
      'Erro ao persistir sessão: Storage error'
    );
  });

  it('deve retornar a sessão quando ela existir', async () => {
    const userData = { type: 'biometric', email: 'teste@test.com' };
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(userData));

    const result = await sessionService.getSession();
    expect(result).toEqual(userData);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.SESSION);
  });

  it('deve retornar null se não houver sessão salva', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);

    const result = await sessionService.getSession();
    expect(result).toBeNull();
  });

  it('deve lançar erro caso ocorra exceção ao buscar a sessão', async () => {
    AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

    await expect(sessionService.getSession()).rejects.toThrow(
      'Erro ao buscar sessão ativa: Storage error'
    );
  });

  it('deve limpar a sessão com sucesso (logout)', async () => {
    AsyncStorage.removeItem.mockResolvedValueOnce();

    await expect(sessionService.clearSession()).resolves.toBeUndefined();
    expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(1);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.SESSION);
  });

  it('deve lançar erro ao falhar ao limpar a sessão', async () => {
    AsyncStorage.removeItem.mockRejectedValueOnce(new Error('Storage error'));

    await expect(sessionService.clearSession()).rejects.toThrow(
      'Erro ao encerrar a sessão: Storage error'
    );
  });
});
