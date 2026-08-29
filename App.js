import React, { useState } from 'react';
import { StyleSheet, StatusBar, Alert } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

export default function App() {
  const [currentStep, setCurrentStep] = useState('login');

  const handleLoginSuccess = (data) => {
    if (data.type === 'biometric') {
      Alert.alert('Sucesso!', 'Login realizado via Biometria com sucesso.');
    } else {
      Alert.alert('Sucesso!', `Bem-vindo de volta, ${data.email}!`);
    }
    setCurrentStep('onboarding');
  };

  const handleOnboardingComplete = (profileData) => {
    Alert.alert(
      'Perfil Completo!',
      `Seja bem-vindo, ${profileData.name}! Seu cadastro foi salvo com sucesso.`
    );
    setCurrentStep('home');
  };

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
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
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
});
