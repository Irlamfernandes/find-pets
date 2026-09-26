import { useState, useEffect, useCallback } from 'react';
import { biometricService } from '../services/biometrics';
import { sessionService } from '../services/session';

export function useLogin(onSuccess) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [hasHardwareBiometric, setHasHardwareBiometric] = useState(false);
  const [biometricOwner, setBiometricOwner] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [authMode, setAuthMode] = useState('home'); // 'home', 'login', 'cadastro'

  const checkBiometricSupport = useCallback(async () => {
    const isAvailable = await biometricService.checkAvailability();
    setHasHardwareBiometric(isAvailable);
    try {
      const owner = await sessionService.getBiometricOwner();
      setBiometricOwner(owner?.usuario || null);
    } catch {
      setBiometricOwner(null);
    }
  }, []);

  useEffect(() => {
    checkBiometricSupport();
  }, [checkBiometricSupport]);

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
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
      const email = usuario.trim();

      // Impede recadastrar um e-mail existente (isso trocaria a senha da conta)
      if (await sessionService.getCredentials(email)) {
        setErrorMessage('Este e-mail já está cadastrado. Faça login.');
        return;
      }

      // A biometria é oferecida no fim do cadastro ou ativada no Perfil
      await sessionService.saveCredentials(email, senha, false);

      setUsuario('');
      setSenha('');
      // Entra direto na conta nova, sem voltar para o login
      onSuccess?.({ type: 'register', usuario: email });
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
      const savedCreds = await sessionService.getCredentials(usuario.trim());

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
    const owner = await sessionService.getBiometricOwner();

    if (!owner) {
      setErrorMessage('Nenhuma conta com biometria neste aparelho.');
      return;
    }

    const result = await biometricService.authenticate(
      'Autentique-se com sua biometria'
    );
    // Entra sempre na conta dona da biometria, nunca em outra
    if (result.success) {
      onSuccess?.({ type: 'biometric', usuario: owner.usuario });
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
    biometricOwner,
    errorMessage,
    authMode,
    setAuthMode,
    handleRegister,
    handleManualLogin,
    triggerBiometricAuth,
  };
}
