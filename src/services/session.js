// src/services/session.js
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bcrypt from 'bcryptjs';
import { STORAGE_KEYS } from '../constants/storageKeys';

export const sessionService = {
  async saveCredentials(usuario, password, hasBiometrics = false) {
    if (!usuario || !password) {
      throw new Error('Usuário e senha são obrigatórios.');
    }
    try {
      // Gera o hash seguro da senha com salt de 10 rounds
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const data = JSON.stringify({ usuario, passwordHash, hasBiometrics });
      await SecureStore.setItemAsync(STORAGE_KEYS.CREDENTIALS, data);
    } catch (error) {
      throw new Error(
        `Erro ao salvar credenciais com segurança: ${error.message}`
      );
    }
  },

  async verifyPassword(inputPassword, storedHash) {
    if (!inputPassword || !storedHash) return false;
    return await bcrypt.compare(inputPassword, storedHash);
  },

  async getCredentials() {
    try {
      const data = await SecureStore.getItemAsync(STORAGE_KEYS.CREDENTIALS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      throw new Error(`Erro ao recuperar credenciais: ${error.message}`);
    }
  },

  async saveSession(userData) {
    if (!userData) {
      throw new Error('Dados de sessão inválidos.');
    }
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SESSION,
        JSON.stringify(userData)
      );
    } catch (error) {
      throw new Error(`Erro ao persistir sessão: ${error.message}`);
    }
  },

  async getSession() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      throw new Error(`Erro ao buscar sessão ativa: ${error.message}`);
    }
  },

  async clearSession() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
    } catch (error) {
      throw new Error(`Erro ao encerrar a sessão: ${error.message}`);
    }
  },
};
