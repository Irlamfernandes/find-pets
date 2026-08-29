import { useState } from 'react';
import { onboardingService } from '../services/onboarding';

export function useOnboarding(onComplete) {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSaveProfile = async () => {
    setErrorMessage('');
    if (!name.trim() || !whatsapp.trim()) {
      setErrorMessage('Preencha todos os campos.');
      return;
    }

    try {
      await onboardingService.saveUserProfile({ name, whatsapp });
      onComplete?.({ name, whatsapp });
    } catch (error) {
      setErrorMessage(error.message || 'Erro ao salvar perfil.');
    }
  };

  return {
    name,
    setName,
    whatsapp,
    setWhatsapp,
    errorMessage,
    handleSaveProfile,
  };
}
