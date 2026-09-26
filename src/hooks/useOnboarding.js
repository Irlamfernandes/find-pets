import { useState } from 'react';
import { onboardingService } from '../services/onboarding';
import { formatPhone, onlyDigits, PHONE_MIN_DIGITS } from '../utils/phoneMask';

export function useOnboarding(onComplete) {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsappState] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const setWhatsapp = (value) => setWhatsappState(formatPhone(value));

  const handleSaveProfile = async () => {
    setErrorMessage('');
    if (!name.trim() || !whatsapp.trim()) {
      setErrorMessage('Preencha todos os campos.');
      return;
    }

    const cleanedPhone = onlyDigits(whatsapp);
    if (cleanedPhone.length < PHONE_MIN_DIGITS) {
      setErrorMessage(
        'Insira um número de WhatsApp válido com código do país e DDD.'
      );
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
