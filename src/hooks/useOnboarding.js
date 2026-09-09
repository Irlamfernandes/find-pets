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

    const cleanedPhone = whatsapp.replace(/\D/g, '');
    if (cleanedPhone.length < 10) {
      setErrorMessage('Insira um número de WhatsApp válido com DDD.');
      return;
    }

    try {
      await onboardingService.saveUserProfile({ name, whatsapp: cleanedPhone });
      onComplete?.({ name, whatsapp: cleanedPhone });
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