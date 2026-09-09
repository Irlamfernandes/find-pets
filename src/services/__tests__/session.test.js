// src/services/__tests__/session.test.js
import { sessionService } from '../session';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bcrypt from 'bcryptjs';

// Mock do expo-secure-store, AsyncStorage e bcryptjs
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('mockSalt'),
  hash: jest.fn().mockResolvedValue('mockPasswordHash'),
  compare: jest.fn(),
}));

describe('sessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- CREDENCIAIS ---
  it('deve lançar erro se tentar salvar credenciais sem usuário ou senha', async () => {
    await expect(sessionService.saveCredentials('', '123')).rejects.toThrow(
      'Usuário e senha são obrigatórios.'
    );
    await expect(
      sessionService.saveCredentials('teste@test.com', '')
    ).rejects.toThrow('Usuário e senha são obrigatórios.');
  });

  it('deve salvar as credenciais com segurança usando SecureStore gerando hash da senha', async () => {
    SecureStore.setItemAsync.mockResolvedValueOnce();

    await expect(
      sessionService.saveCredentials('teste@test.com', '123456', true)
    ).resolves.toBeUndefined();

    expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
    expect(bcrypt.hash).toHaveBeenCalledWith('123456', 'mockSalt');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      STORAGE_KEYS.CREDENTIALS,
      JSON.stringify({
        usuario: 'teste@test.com',
        passwordHash: 'mockPasswordHash',
        hasBiometrics: true,
      })
    );
  });

  it('deve lançar erro ao falhar ao salvar credenciais', async () => {
    SecureStore.setItemAsync.mockRejectedValueOnce(new Error('Secure error'));

    await expect(
      sessionService.saveCredentials('teste@test.com', '123456')
    ).rejects.toThrow('Erro ao salvar credenciais com segurança: Secure error');
  });

  it('deve retornar as credenciais quando elas existirem', async () => {
    const creds = {
      usuario: 'teste@test.com',
      passwordHash: 'mockPasswordHash',
      hasBiometrics: false,
    };
    SecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(creds));

    const result = await sessionService.getCredentials();
    expect(result).toEqual(creds);
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith(
      STORAGE_KEYS.CREDENTIALS
    );
  });

  it('deve retornar null se não houver credenciais salvas', async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce(null);

    const result = await sessionService.getCredentials();
    expect(result).toBeNull();
  });

  it('deve lançar erro caso ocorra exceção ao buscar as credenciais', async () => {
    SecureStore.getItemAsync.mockRejectedValueOnce(new Error('Secure error'));

    await expect(sessionService.getCredentials()).rejects.toThrow(
      'Erro ao recuperar credenciais: Secure error'
    );
  });

  // --- VERIFICAÇÃO DE SENHA (verifyPassword) ---
  it('deve retornar false se faltar senha ou hash na verificação', async () => {
    expect(await sessionService.verifyPassword('', 'hash')).toBe(false);
    expect(await sessionService.verifyPassword('123', '')).toBe(false);
  });

  it('deve retornar true se a senha coincidir com o hash', async () => {
    bcrypt.compare.mockResolvedValueOnce(true);
    const result = await sessionService.verifyPassword(
      '123456',
      'mockPasswordHash'
    );
    expect(result).toBe(true);
    expect(bcrypt.compare).toHaveBeenCalledWith('123456', 'mockPasswordHash');
  });

  // --- SESSÃO (Mantido com AsyncStorage) ---
  it('deve lançar erro se tentar salvar sessão com dados inválidos', async () => {
    await expect(sessionService.saveSession(null)).rejects.toThrow(
      'Dados de sessão inválidos.'
    );
  });

  it('deve salvar a sessão com sucesso', async () => {
    AsyncStorage.setItem.mockResolvedValueOnce();

    const userData = { type: 'biometric', usuario: 'teste@test.com' };
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
    const userData = { type: 'biometric', usuario: 'teste@test.com' };
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
