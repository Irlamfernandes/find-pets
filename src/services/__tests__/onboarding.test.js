// src/services/__tests__/onboarding.test.js
import { onboardingService } from '../onboarding';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock do AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('onboardingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve salvar o perfil com sucesso quando os dados forem válidos', async () => {
    const profile = { name: 'Irlam', whatsapp: '11999999999' };
    const result = await onboardingService.saveUserProfile(profile);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(profile);
  });

  it('deve lançar erro se tentar salvar sem profileData, nome ou whatsapp', async () => {
    await expect(onboardingService.saveUserProfile(null)).rejects.toThrow(
      'Dados inválidos para salvamento do perfil.'
    );

    await expect(
      onboardingService.saveUserProfile({ name: '', whatsapp: '' })
    ).rejects.toThrow('Dados inválidos para salvamento do perfil.');

    await expect(
      onboardingService.saveUserProfile({ name: 'Irlam', whatsapp: '' })
    ).rejects.toThrow('Dados inválidos para salvamento do perfil.');

    await expect(
      onboardingService.saveUserProfile({ name: '', whatsapp: '11999999999' })
    ).rejects.toThrow('Dados inválidos para salvamento do perfil.');
  });

  it('deve lançar erro se houver falha no AsyncStorage ao salvar', async () => {
    AsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));

    const profile = { name: 'Irlam', whatsapp: '11999999999' };
    await expect(onboardingService.saveUserProfile(profile)).rejects.toThrow(
      'Erro ao salvar perfil: Storage error'
    );
  });

  it('deve retornar o perfil com sucesso quando houver dados salvos', async () => {
    const profile = { name: 'Irlam', whatsapp: '11999999999' };
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(profile));

    const result = await onboardingService.getUserProfile();
    expect(result).toEqual(profile);
  });

  it('deve retornar null se não houver perfil salvo', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);

    const result = await onboardingService.getUserProfile();
    expect(result).toBeNull();
  });

  it('deve lançar erro se houver exceção no AsyncStorage ao buscar o perfil', async () => {
    AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

    await expect(onboardingService.getUserProfile()).rejects.toThrow(
      'Erro ao buscar perfil: Storage error'
    );
  });
});
