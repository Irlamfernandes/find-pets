// App.js
import 'react-native-get-random-values';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import FeedScreen from './src/screens/FeedScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ReportLostPetScreen from './src/screens/ReportLostPetScreen';
import UnlockScreen from './src/screens/UnlockScreen';
import { palette } from './src/theme/colors';

import { useSession } from './src/hooks/useSession';
import { sessionService } from './src/services/session';
import { onboardingService } from './src/services/onboarding';
import { AppAlertProvider, useAppAlert } from './src/components/AppAlert';
import { useBiometricOffer } from './src/hooks/useBiometricOffer';
import PasswordPromptModal from './src/components/PasswordPromptModal';

function AppContent() {
  const { isLoading, session, saveUserSession, logout } = useSession();
  const showAlert = useAppAlert();
  const { offerBiometrics, passwordPromptProps } = useBiometricOffer();
  const [currentStep, setCurrentStep] = useState('loading');
  // Registro aberto para edição (null = novo registro)
  const [editingPost, setEditingPost] = useState(null);

  // A tela inicial é decidida só ao abrir o app; depois disso, login e
  // onboarding controlam a navegação (senão o desbloqueio reapareceria)
  const hasResolvedInitialStep = useRef(false);

  const determineInitialStep = useCallback(() => {
    if (isLoading || hasResolvedInitialStep.current) return;
    hasResolvedInitialStep.current = true;

    // Sessão salva de um uso anterior: confirmar a identidade antes de entrar
    setCurrentStep(session?.usuario ? 'unlock' : 'login');
  }, [isLoading, session]);

  const goToHomeOrOnboarding = async () => {
    try {
      const profile = await onboardingService.getUserProfile();
      setCurrentStep(profile ? 'home' : 'onboarding');
    } catch {
      setCurrentStep('onboarding');
    }
  };

  useEffect(() => {
    determineInitialStep();
  }, [determineInitialStep]);

  const handleLoginSuccess = async (data) => {
    if (data.type === 'register') {
      showAlert({
        type: 'success',
        title: 'Conta criada',
        message: 'Agora complete seu perfil para começar.',
      });
    } else {
      showAlert({
        type: 'success',
        title: 'Login realizado',
        message:
          data.type === 'biometric'
            ? 'Login realizado via Biometria com sucesso.'
            : `Bem-vindo de volta, ${data.usuario}!`,
      });
    }
    await saveUserSession(data);
    await goToHomeOrOnboarding();
  };

  const handleOnboardingComplete = async (profileData) => {
    try {
      const currentSession = (await sessionService.getSession()) || {};
      const updatedSession = { ...currentSession, profile: profileData };
      await saveUserSession(updatedSession);
      setCurrentStep('home');

      // Fim do cadastro: convida a ativar a biometria, se estiver disponível
      const offered = await offerBiometrics(
        currentSession.usuario,
        profileData.name
      );
      if (!offered) {
        showAlert({
          type: 'success',
          title: 'Perfil completo',
          message: `Seja bem-vindo, ${profileData.name}! Seu cadastro foi salvo com sucesso.`,
        });
      }
    } catch (error) {
      showAlert({
        type: 'danger',
        title: 'Não foi possível concluir',
        message: `Falha ao salvar sessão com o perfil. ${error.message}`,
      });
    }
  };

  const openReport = (post) => {
    setEditingPost(post);
    setCurrentStep('report');
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

      <PasswordPromptModal {...passwordPromptProps} />

      {currentStep === 'unlock' && session?.usuario && (
        <UnlockScreen
          usuario={session.usuario}
          onUnlocked={goToHomeOrOnboarding}
          onSwitchAccount={handleLogout}
        />
      )}

      {currentStep === 'login' && (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}

      {currentStep === 'onboarding' && (
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      )}

      {currentStep === 'home' && (
        <FeedScreen
          onOpenProfile={() => setCurrentStep('profile')}
          onOpenReport={() => openReport(null)}
          onEditPost={openReport}
        />
      )}

      {currentStep === 'report' && (
        <ReportLostPetScreen
          initialPost={editingPost}
          onBack={() => setCurrentStep('home')}
          onSaved={() => setCurrentStep('home')}
        />
      )}

      {currentStep === 'profile' && (
        <ProfileScreen
          onBack={() => setCurrentStep('home')}
          onOpenReport={() => openReport(null)}
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
