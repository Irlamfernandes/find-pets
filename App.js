import React, { useEffect } from 'react';
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
  const [currentStep, setCurrentStep] = React.useState('loading');

  useEffect(() => {
    async function checkInitialState() {
      if (!isLoading) {
        if (session) {
          // Se já tem sessão, verifica se o perfil de onboarding já foi preenchido
          const profile = await onboardingService.getUserProfile();
          if (profile) {
            setCurrentStep('home');
          } else {
            setCurrentStep('onboarding');
          }
        } else {
          setCurrentStep('login');
        }
      }
    }
    checkInitialState();
  }, [isLoading, session]);

  const handleLoginSuccess = async (data) => {
    if (data.type === 'biometric') {
      Alert.alert('Sucesso!', 'Login realizado via Biometria com sucesso.');
    } else {
      Alert.alert('Sucesso!', `Bem-vindo de volta, ${data.email}!`);
    }

    await saveUserSession(data);

    // Se já fez o onboarding antes, vai pra home. Senão, vai preencher o perfil.
    const profile = await onboardingService.getUserProfile();
    if (profile) {
      setCurrentStep('home');
    } else {
      setCurrentStep('onboarding');
    }
  };

  const handleOnboardingComplete = async (profileData) => {
    Alert.alert(
      'Perfil Completo!',
      `Seja bem-vindo, ${profileData.name}! Seu cadastro foi salvo com sucesso.`
    );

    const currentSession = (await sessionService.getSession()) || {};
    const updatedSession = { ...currentSession, profile: profileData };
    await saveUserSession(updatedSession);

    setCurrentStep('home');
  };

  const handleLogout = async () => {
    await logout();
    setCurrentStep('login');
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
