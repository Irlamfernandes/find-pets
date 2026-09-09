// App.js
import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import FeedScreen from './src/screens/FeedScreen';

import { useSession } from './src/hooks/useSession';
import { sessionService } from './src/services/session';
import { onboardingService } from './src/services/onboarding';

export default function App() {
  const { isLoading, session, saveUserSession, logout } = useSession();
  const [currentStep, setCurrentStep] = useState('loading');

  const determineInitialStep = useCallback(async () => {
    if (isLoading) return;

    try {
      if (!session) {
        setCurrentStep('login');
        return;
      }

      // Se há sessão ativa, valida se o perfil de onboarding já existe
      const profile = await onboardingService.getUserProfile();
      setCurrentStep(profile ? 'home' : 'onboarding');
    } catch (error) {
      Alert.alert(
        'Erro',
        `Não foi possível carregar os dados do usuário: ${error.message}`
      );
      setCurrentStep('login');
    }
  }, [isLoading, session]);

  useEffect(() => {
    determineInitialStep();
  }, [determineInitialStep]);

  const handleLoginSuccess = async (data) => {
    const welcomeMessage =
      data.type === 'biometric'
        ? 'Login realizado via Biometria com sucesso.'
        : `Bem-vindo de volta, ${data.usuario}!`;

    Alert.alert('Sucesso!', welcomeMessage);
    await saveUserSession(data);

    try {
      const profile = await onboardingService.getUserProfile();
      setCurrentStep(profile ? 'home' : 'onboarding');
    } catch {
      setCurrentStep('onboarding');
    }
  };

  const handleOnboardingComplete = async (profileData) => {
    Alert.alert(
      'Perfil Completo!',
      `Seja bem-vindo, ${profileData.name}! Seu cadastro foi salvo com sucesso.`
    );

    try {
      const currentSession = (await sessionService.getSession()) || {};
      const updatedSession = { ...currentSession, profile: profileData };
      await saveUserSession(updatedSession);
      setCurrentStep('home');
    } catch (error) {
      Alert.alert(
        'Erro',
        `Falha ao salvar sessão com o perfil: ${error.message}`
      );
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentStep('login');
    } catch (error) {
      Alert.alert(
        'Erro',
        `Não foi possível encerrar a sessão: ${error.message}`
      );
    }
  };

  if (isLoading || currentStep === 'loading') {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

        {currentStep === 'login' && (
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        )}

        {currentStep === 'onboarding' && (
          <OnboardingScreen onComplete={handleOnboardingComplete} />
        )}

        {currentStep === 'home' && <FeedScreen onLogout={handleLogout} />}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
