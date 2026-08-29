import { onboardingService } from '../onboarding';

describe('onboardingService', () => {
  it('deve salvar o perfil com sucesso quando os dados forem válidos', async () => {
    const profile = { name: 'Irlam', whatsapp: '11999999999' };
    const result = await onboardingService.saveUserProfile(profile);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(profile);
  });

  it('deve lançar erro se tentar salvar sem nome ou whatsapp', async () => {
    await expect(
      onboardingService.saveUserProfile({ name: '', whatsapp: '' })
    ).rejects.toThrow('Dados inválidos para salvamento.');
  });
});
