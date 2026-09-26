// src/services/session.js
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bcrypt from 'bcryptjs';
import { STORAGE_KEYS } from '../../../shared/constants/storageKeys';

export const sessionService = {
  async saveCredentials(usuario, password, hasBiometrics = false) {
    if (!usuario || !password) {
      throw new Error('Usuário e senha são obrigatórios.');
    }
    try {
      // Gera o hash seguro da senha com salt de 10 rounds
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newCredentials = { usuario, passwordHash, hasBiometrics };
      const savedData = await SecureStore.getItemAsync(
        STORAGE_KEYS.CREDENTIALS
      );
      const savedCredentials = savedData ? JSON.parse(savedData) : null;

      let credentials = [];
      if (Array.isArray(savedCredentials)) {
        credentials = savedCredentials;
      } else if (savedCredentials) {
        credentials = [savedCredentials];
      }

      const updatedCredentials = [
        ...credentials.filter((item) => item.usuario !== usuario),
        newCredentials,
      ];
      const data = JSON.stringify(
        updatedCredentials.length === 1 ? newCredentials : updatedCredentials
      );
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

  async getCredentials(usuario) {
    try {
      const data = await SecureStore.getItemAsync(STORAGE_KEYS.CREDENTIALS);
      if (!data) return null;

      const savedCredentials = JSON.parse(data);
      if (!Array.isArray(savedCredentials)) {
        return !usuario || savedCredentials.usuario === usuario
          ? savedCredentials
          : null;
      }

      return usuario
        ? savedCredentials.find((item) => item.usuario === usuario) || null
        : savedCredentials[0] || null;
    } catch (error) {
      throw new Error(`Erro ao recuperar credenciais: ${error.message}`);
    }
  },

  // A biometria do aparelho fica vinculada a uma única conta: o sistema não
  // informa ao app qual digital/rosto foi usado, então não há como separar
  // biometrias de pessoas diferentes no mesmo celular.
  async getBiometricOwner() {
    try {
      const data = await SecureStore.getItemAsync(STORAGE_KEYS.CREDENTIALS);
      if (!data) return null;

      const savedCredentials = JSON.parse(data);
      const credentials = Array.isArray(savedCredentials)
        ? savedCredentials
        : [savedCredentials];
      return credentials.find((item) => item.hasBiometrics) || null;
    } catch (error) {
      throw new Error(`Erro ao verificar a biometria: ${error.message}`);
    }
  },

  // Ativa/desativa a biometria de uma conta. Só uma conta por aparelho pode
  // tê-la, pois o sistema não diferencia as digitais/rostos cadastrados.
  async setBiometrics(usuario, enabled) {
    try {
      const data = await SecureStore.getItemAsync(STORAGE_KEYS.CREDENTIALS);
      const savedCredentials = data ? JSON.parse(data) : [];
      const credentials = Array.isArray(savedCredentials)
        ? savedCredentials
        : [savedCredentials];

      if (!credentials.some((item) => item.usuario === usuario)) {
        throw new Error('Conta não encontrada.');
      }
      const usedByOtherAccount = credentials.some(
        (item) => item.hasBiometrics && item.usuario !== usuario
      );
      if (enabled && usedByOtherAccount) {
        throw new Error('A biometria deste aparelho já está em uso.');
      }

      const updatedCredentials = credentials.map((item) =>
        item.usuario === usuario ? { ...item, hasBiometrics: enabled } : item
      );
      await SecureStore.setItemAsync(
        STORAGE_KEYS.CREDENTIALS,
        JSON.stringify(
          updatedCredentials.length === 1
            ? updatedCredentials[0]
            : updatedCredentials
        )
      );
    } catch (error) {
      throw new Error(`Erro ao atualizar a biometria: ${error.message}`);
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
