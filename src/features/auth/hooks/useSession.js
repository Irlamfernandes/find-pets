import { useState, useEffect, useCallback } from 'react';
import { sessionService } from '../services/sessionService';
import { runStorageMigrations } from '../../../app/storageMigrations';

export function useSession() {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);

  const checkSession = useCallback(async () => {
    setIsLoading(true);
    try {
      // Converte dados gravados por versões antigas antes de qualquer leitura
      await runStorageMigrations();
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

  const saveUserSession = async (userData) => {
    await sessionService.saveSession(userData);
    setSession(userData);
  };

  const logout = async () => {
    await sessionService.clearSession();
    setSession(null);
  };

  return {
    isLoading,
    session,
    saveUserSession,
    logout,
    checkSession,
  };
}
