import { useState, useEffect, useCallback } from 'react';
import { sessionService } from '../services/sessionService';
import { signOut } from '../services/signInService';

// Sessão da conta conectada: carrega ao abrir o app, salva ao entrar e
// limpa ao sair
export function useSession() {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);

  const checkSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentSession = await sessionService.getSession();
      setSession(currentSession);
    } catch {
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Guarda a sessão de quem acabou de entrar
  const saveUserSession = async (userData) => {
    await sessionService.saveSession(userData);
    setSession(userData);
  };

  // Sai da conta: apaga a sessão do aparelho e o login do Firebase
  const logout = async () => {
    await sessionService.clearSession();
    await signOut();
    setSession(null);
  };

  return {
    isLoading,
    session,
    saveUserSession,
    logout,
  };
}
