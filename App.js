// App.js
import 'react-native-get-random-values';
import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import FeedScreen from './src/screens/FeedScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { palette } from './src/theme/colors';

import { useSession } from './src/hooks/useSession';
import { sessionService } from './src/services/session';
import { onboardingService } from './src/services/onboarding';

export default function App() {
  const { isLoading, session, saveUserSession, logout } = useSession();
  const [currentStep, setCurrentStep] = useState('loading');
  const [shouldOpenCamera, setShouldOpenCamera] = useState(false);

  const determineInitialStep = useCallback(async () => {
    if (isLoading) return;

    try {
      if (!session) {
        setCurrentStep('login');
        return;
      }

      // Se há sessão ativa, valida se o perfil de onboarding já existe[cite: 2]
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

  const handleOpenCamera = () => {
    setShouldOpenCamera(true);
    setCurrentStep('home');
  };

  const handleCameraRequestHandled = useCallback(() => {
    setShouldOpenCamera(false);
  }, []);

  if (isLoading || currentStep === 'loading') {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color={palette.primary} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={palette.background}
        />

        {currentStep === 'login' && (
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        )}

        {currentStep === 'onboarding' && (
          <OnboardingScreen onComplete={handleOnboardingComplete} />
        )}

        {currentStep === 'home' && (
          <FeedScreen
            onOpenProfile={() => setCurrentStep('profile')}
            openCameraOnMount={shouldOpenCamera}
            onCameraRequestHandled={handleCameraRequestHandled}
          />
        )}

        {currentStep === 'profile' && (
          <ProfileScreen
            onBack={() => setCurrentStep('home')}
            onOpenCamera={handleOpenCamera}
            onLogout={handleLogout}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
