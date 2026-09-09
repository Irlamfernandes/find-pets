// src/hooks/useLogin.js
import { useState, useEffect, useCallback } from 'react';
import { biometricService } from '../services/biometrics';
import { sessionService } from '../services/session';

export function useLogin(onSuccess) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [hasHardwareBiometric, setHasHardwareBiometric] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [authMode, setAuthMode] = useState('home'); // 'home', 'login', 'cadastro'

  const checkBiometricSupport = useCallback(async () => {
    const isAvailable = await biometricService.checkAvailability();
    setHasHardwareBiometric(isAvailable);
  }, []);

  useEffect(() => {
    checkBiometricSupport();
  }, [checkBiometricSupport]);

  // Função auxiliar para validar formato de e-mail
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 1. CADASTRO: Salva usuário, senha e biometria (se o usuário aceitar)
  const handleRegister = async () => {
    setErrorMessage('');
    if (!usuario.trim() || !senha.trim()) {
      setErrorMessage('Preencha usuário e senha.');
      return;
    }

    // Validar formato do e-mail
    if (!isValidEmail(usuario.trim())) {
      setErrorMessage('Insira um formato de e-mail válido.');
      return;
    }

    try {
      let cadastrouBiometria = false;

      // Se o celular tiver leitor biométrico, tenta cadastrar/vincular
      if (hasHardwareBiometric) {
        const result = await biometricService.authenticate(
          'Cadastre sua biometria para futuros logins'
        );
        if (result.success) {
          cadastrouBiometria = true;
        }
      }

      // Salva as credenciais e se a biometria foi habilitada
      await sessionService.saveCredentials(
        usuario.trim(),
        senha,
        cadastrouBiometria
      );

      alert('Cadastro realizado com sucesso! Faça o login.');
      setAuthMode('home');
      setUsuario('');
      setSenha('');
    } catch (error) {
      setErrorMessage(error.message || 'Erro ao realizar o cadastro.');
    }
  };

  // 2. LOGIN MANUAL: Valida usuário e senha estritos
  const handleManualLogin = async () => {
    setErrorMessage('');
    if (!usuario.trim() || !senha.trim()) {
      setErrorMessage('Preencha usuário e senha.');
      return;
    }

    // Validar formato do e-mail também no login
    if (!isValidEmail(usuario.trim())) {
      setErrorMessage('Insira um formato de e-mail válido.');
      return;
    }

    try {
      const savedCreds = await sessionService.getCredentials();

      const isPasswordValid = savedCreds
        ? await sessionService.verifyPassword(senha, savedCreds.passwordHash)
        : false;

      if (
        !savedCreds ||
        savedCreds.usuario !== usuario.trim() ||
        !isPasswordValid
      ) {
        setErrorMessage('Usuário não existe ou senha errada.');
        return;
      }

      onSuccess?.({ type: 'credentials', usuario: savedCreds.usuario });
    } catch (error) {
      setErrorMessage(error.message || 'Erro ao realizar o login.');
    }
  };

  // 3. LOGIN POR BIOMETRIA
  const triggerBiometricAuth = async () => {
    setErrorMessage('');
    const savedCreds = await sessionService.getCredentials();

    if (!savedCreds) {
      setErrorMessage('Nenhum usuário cadastrado neste dispositivo.');
      return;
    }

    if (!savedCreds.hasBiometrics) {
      setErrorMessage('A biometria não foi cadastrada para este usuário.');
      return;
    }

    const result = await biometricService.authenticate(
      'Autentique-se com sua biometria'
    );
    if (result.success) {
      onSuccess?.({ type: 'biometric', usuario: savedCreds.usuario });
    } else if (result.error && result.error !== 'user_cancel') {
      setErrorMessage('Biometria não reconhecida.');
    }
  };

  return {
    usuario,
    setUsuario,
    senha,
    setSenha,
    hasHardwareBiometric,
    errorMessage,
    authMode,
    setAuthMode,
    handleRegister,
    handleManualLogin,
    triggerBiometricAuth,
  };
}
