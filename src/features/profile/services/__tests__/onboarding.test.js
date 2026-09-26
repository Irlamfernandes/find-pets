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

  it('deve salvar perfis separados para usuários diferentes', async () => {
    const profile = { name: 'Segundo', whatsapp: '11888888888' };
    AsyncStorage.getItem.mockResolvedValueOnce(
      JSON.stringify({
        'primeiro@test.com': { name: 'Primeiro', whatsapp: '11999999999' },
      })
    );

    await onboardingService.saveUserProfile(profile, 'segundo@test.com');

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'FindPets_profile',
      JSON.stringify({
        'primeiro@test.com': {
          name: 'Primeiro',
          whatsapp: '11999999999',
        },
        'segundo@test.com': profile,
      })
    );
  });

  it('deve buscar o perfil do usuário solicitado', async () => {
    const profiles = {
      'primeiro@test.com': { name: 'Primeiro', whatsapp: '11999999999' },
      'segundo@test.com': { name: 'Segundo', whatsapp: '11888888888' },
    };
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(profiles));

    await expect(
      onboardingService.getUserProfile('segundo@test.com')
    ).resolves.toEqual(profiles['segundo@test.com']);
  });

  it('deve migrar um perfil legado ao salvar para um usuário identificado', async () => {
    const profile = { name: 'Atualizado', whatsapp: '11777777777' };
    AsyncStorage.getItem.mockResolvedValueOnce(
      JSON.stringify({ name: 'Legado', whatsapp: '11999999999' })
    );

    await onboardingService.saveUserProfile(profile, 'usuario@test.com');

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'FindPets_profile',
      JSON.stringify({ 'usuario@test.com': profile })
    );
  });

  it('deve criar o mapa de perfis quando o usuário ainda não possui perfil', async () => {
    const profile = { name: 'Novo', whatsapp: '11666666666' };
    AsyncStorage.getItem.mockResolvedValueOnce(null);

    await onboardingService.saveUserProfile(profile, 'novo@test.com');

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'FindPets_profile',
      JSON.stringify({ 'novo@test.com': profile })
    );
  });

  it('deve retornar null quando o perfil solicitado não existir', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(
      JSON.stringify({ 'primeiro@test.com': { name: 'Primeiro' } })
    );

    await expect(
      onboardingService.getUserProfile('inexistente@test.com')
    ).resolves.toBeNull();
  });

  it('deve lançar erro se houver exceção no AsyncStorage ao buscar o perfil', async () => {
    AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

    await expect(onboardingService.getUserProfile()).rejects.toThrow(
      'Erro ao buscar perfil: Storage error'
    );
  });
});
