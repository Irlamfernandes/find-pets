import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storageKeys';

export const sessionService = {
  async saveCredentials(email, password, hasBiometrics = false) {
    if (!email || !password) {
      throw new Error('E-mail e senha são obrigatórios.');
    }
    try {
      const data = JSON.stringify({ email, password, hasBiometrics });
      await AsyncStorage.setItem(STORAGE_KEYS.CREDENTIALS, data);
    } catch (error) {
      throw new Error(`Erro ao salvar credenciais: ${error.message}`);
    }
  },

  async getCredentials() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CREDENTIALS);
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
