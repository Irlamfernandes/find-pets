import { useState, useEffect, useCallback } from 'react';
import { sessionService } from '../services/session';

export function useSession() {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);

  const checkSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentSession = await sessionService.getSession();
      setSession(currentSession);
    } catch (error) {
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
