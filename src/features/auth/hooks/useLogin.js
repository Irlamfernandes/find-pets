import { useState, useEffect, useCallback } from 'react';
import { biometricService } from '../services/biometrics';
import { accountService } from '../services/accountService';
import {
  rule,
  validate,
  isFilled,
  isValidEmail,
  normalizeEmail,
} from '../../../shared/utils/validation';

const credentialRules = [
  rule(
    ({ usuario, senha }) => isFilled(usuario) && isFilled(senha),
    'Preencha usuário e senha.'
  ),
  rule(
    ({ usuario }) => isValidEmail(usuario.trim()),
    'Insira um formato de e-mail válido.'
  ),
];

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
      const owner = await accountService.getBiometricOwner();
      setBiometricOwner(owner?.usuario || null);
    } catch {
      setBiometricOwner(null);
    }
  }, []);

  useEffect(() => {
    checkBiometricSupport();
  }, [checkBiometricSupport]);

  // Valida o formulário e executa a ação com o e-mail já sem espaços.
  // A ação devolve uma mensagem de erro ou nada, quando dá certo.
  const submitWith = (action, fallbackError) => async () => {
    setErrorMessage('');
    const invalid = validate({ usuario, senha }, credentialRules);
    if (invalid) {
      setErrorMessage(invalid);
      return;
    }

    try {
      const failure = await action(usuario.trim());
      if (failure) setErrorMessage(failure);
    } catch (error) {
      setErrorMessage(error.message || fallbackError);
    }
  };

  // Cria a conta e entra direto nela, sem voltar para o login. A biometria
  // é oferecida no fim do cadastro ou ativada no Perfil.
  const handleRegister = submitWith(async (email) => {
    await accountService.createAccount(email, senha);
    setUsuario('');
    setSenha('');
    onSuccess?.({ type: 'register', usuario: normalizeEmail(email) });
  }, 'Erro ao realizar o cadastro.');

  // Entra com o e-mail como foi cadastrado, mesmo que digitado com outras
  // maiúsculas, para a sessão sempre apontar para a mesma conta
  const handleManualLogin = submitWith(async (email) => {
    const usuarioConta = await accountService.authenticate(email, senha);
    if (!usuarioConta) return 'Usuário não existe ou senha errada.';
    onSuccess?.({ type: 'credentials', usuario: usuarioConta });
  }, 'Erro ao realizar o login.');

  // Entra sempre na conta dona da biometria, nunca em outra
  const triggerBiometricAuth = async () => {
    setErrorMessage('');
    const owner = await accountService.getBiometricOwner();
    if (!owner) {
      setErrorMessage('Nenhuma conta com biometria neste aparelho.');
      return;
    }

    const result = await biometricService.authenticate(
      'Autentique-se com sua biometria'
    );
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
