export const onboardingService = {
  async saveUserProfile(profileData) {
    if (!profileData.name || !profileData.whatsapp) {
      throw new Error('Dados inválidos para salvamento.');
    }
    return { success: true, data: profileData };
  },
};
