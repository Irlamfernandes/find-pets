import { useState } from 'react';
import { accountService } from '../services/accountService';
import { sessionService } from '../services/sessionService';

async function checkCurrentUserPassword(password) {
  const usuario = await sessionService.getCurrentUser();
  return accountService.checkPassword(usuario, password);
}

async function getPasswordError(verify, password, payload) {
  if (!password.trim()) return 'Digite sua senha.';
  try {
    const isValid = await verify(password, payload);
    return isValid ? null : 'Senha incorreta. Tente novamente.';
  } catch {
    return 'Não foi possível verificar a senha agora.';
  }
}

// Controla um PasswordPromptModal: pede a senha antes de uma ação sensível e
// só executa `onConfirmed(payload)` quando ela confere. `payload` identifica
// o que foi pedido (ex.: 'activate') e continua disponível enquanto o modal
// fecha, para o texto não trocar durante a animação. Por padrão, confere a
// senha da conta conectada.
export function usePasswordPrompt({
  onConfirmed,
  verify = checkCurrentUserPassword,
}) {
  const [request, setRequest] = useState({ visible: false, payload: null });
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const open = (payload = null) => {
    setErrorMessage('');
    setRequest({ visible: true, payload });
  };

  const close = () => {
    setErrorMessage('');
    setRequest((current) => ({ ...current, visible: false }));
  };

  const confirm = async (password) => {
    setIsVerifying(true);
    const error = await getPasswordError(verify, password, request.payload);
    setIsVerifying(false);
    if (error) {
      setErrorMessage(error);
      return false;
    }

    close();
    await onConfirmed(request.payload);
    return true;
  };

  return {
    open,
    payload: request.payload,
    promptProps: {
      visible: request.visible,
      errorMessage,
      isVerifying,
      onCancel: close,
      onConfirm: confirm,
    },
  };
}
