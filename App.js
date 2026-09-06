import React, { useEffect } from 'react';
import {
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { useSession } from './src/hooks/useSession';
import { sessionService } from './src/services/session';

export default function App() {
  const { isLoading, session, saveUserSession, logout } = useSession();
  const [currentStep, setCurrentStep] = React.useState('loading');

  useEffect(() => {
    if (!isLoading) {
      if (session) {
        // Se já tem sessão e perfil completo, vai para home; senão, onboarding ou login
        setCurrentStep('home');
      } else {
        setCurrentStep('login');
      }
    }
  }, [isLoading, session]);

  const handleLoginSuccess = async (data) => {
    if (data.type === 'biometric') {
      Alert.alert('Sucesso!', 'Login realizado via Biometria com sucesso.');
    } else {
      Alert.alert('Sucesso!', `Bem-vindo de volta, ${data.email}!`);
    }

    await saveUserSession(data);
    setCurrentStep('onboarding');
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

        {currentStep === 'home' && (
          <View style={[styles.container, styles.centered]}>
            <Text style={styles.welcomeText}>
              Bem-vindo ao Feed Principal (Find Pets)!
            </Text>
            <TouchableOpacity
              testID="button-logout"
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>
                Sair da Conta (Logout)
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
