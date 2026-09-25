// App.js
import 'react-native-get-random-values';
import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import FeedScreen from './src/screens/FeedScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { palette } from './src/theme/colors';

import { useSession } from './src/hooks/useSession';
import { sessionService } from './src/services/session';
import { onboardingService } from './src/services/onboarding';
import { AppAlertProvider } from './src/components/AppAlert';
import { useAppAlert } from './src/components/AppAlert';

function AppContent() {
  const { isLoading, session, saveUserSession, logout } = useSession();
  const showAlert = useAppAlert();
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
      showAlert({
        type: 'danger',
        title: 'Não foi possível iniciar',
        message: `Não foi possível carregar os dados do usuário. ${error.message}`,
      });
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

    showAlert({
      type: 'success',
      title: 'Login realizado',
      message: welcomeMessage,
    });
    await saveUserSession(data);

    try {
      const profile = await onboardingService.getUserProfile();
      setCurrentStep(profile ? 'home' : 'onboarding');
    } catch {
      setCurrentStep('onboarding');
    }
  };

  const handleOnboardingComplete = async (profileData) => {
    showAlert({
      type: 'success',
      title: 'Perfil completo',
      message: `Seja bem-vindo, ${profileData.name}! Seu cadastro foi salvo com sucesso.`,
    });

    try {
      const currentSession = (await sessionService.getSession()) || {};
      const updatedSession = { ...currentSession, profile: profileData };
      await saveUserSession(updatedSession);
      setCurrentStep('home');
    } catch (error) {
      showAlert({
        type: 'danger',
        title: 'Não foi possível concluir',
        message: `Falha ao salvar sessão com o perfil. ${error.message}`,
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentStep('login');
    } catch (error) {
      showAlert({
        type: 'danger',
        title: 'Não foi possível sair',
        message: `Tente novamente. ${error.message}`,
      });
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
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={palette.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.background} />

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
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppAlertProvider>
        <AppContent />
      </AppAlertProvider>
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
