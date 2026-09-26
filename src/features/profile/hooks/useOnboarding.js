import { useState } from 'react';
import { profileService } from '../services/profileService';
import { toProfileData } from '../profileForm';
import {
  formatPhone,
  onlyDigits,
  PHONE_MIN_DIGITS,
} from '../../../shared/utils/phoneMask';
import { rule, validate, isFilled } from '../../../shared/utils/validation';

const onboardingRules = [
  rule(
    ({ name, whatsapp }) => isFilled(name) && isFilled(whatsapp),
    'Preencha todos os campos.'
  ),
  rule(
    ({ whatsapp }) => onlyDigits(whatsapp).length >= PHONE_MIN_DIGITS,
    'Insira um número de WhatsApp válido com código do país e DDD.'
  ),
];

export function useOnboarding(onComplete) {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsappState] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const setWhatsapp = (value) => setWhatsappState(formatPhone(value));

  const handleSaveProfile = async () => {
    const invalid = validate({ name, whatsapp }, onboardingRules);
    setErrorMessage(invalid || '');
    if (invalid) return;

    try {
      const profile = toProfileData({ name, whatsapp });
      await profileService.saveProfile(profile);
      onComplete?.(profile);
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
