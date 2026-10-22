import { useState } from 'react';
import {
  createFoundForm,
  foundFormRules,
  toFoundInfo,
} from '../domain/foundForm';
import { validate } from '../../../shared/utils/validation';

// Estado do formulário de reencontro; `confirm` valida e envia os dados.
// `lostAt` (data do desaparecimento) impede um reencontro anterior a ela.
export function useFoundForm(onConfirm, lostAt) {
  const [form, setForm] = useState(createFoundForm);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Altera um campo do formulário
  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  // Limpa o formulário e o erro
  const reset = () => {
    setForm(createFoundForm());
    setErrorMessage('');
  };

  // Valida e, se estiver tudo certo, salva o reencontro
  const confirm = async () => {
    const invalid = validate({ ...form, lostAt }, foundFormRules);
    setErrorMessage(invalid || '');
    if (invalid) return;

    setIsSaving(true);
    try {
      await onConfirm(toFoundInfo(form));
    } finally {
      setIsSaving(false);
    }
  };

  return { form, updateField, errorMessage, isSaving, reset, confirm };
}
