// App.js
import './src/shared/polyfills/randomValues';
import React from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { palette } from './src/shared/theme/colors';
import { AppAlertProvider } from './src/shared/components/AppAlert';
import PasswordPromptModal from './src/shared/components/PasswordPromptModal';
import { useAppFlow } from './src/app/useAppFlow';
import { AppScreens } from './src/app/AppScreens';
import { SCREENS } from './src/app/navigation';

// Conteúdo do app: carregando, ou a tela atual com a janela de senha
function AppContent() {
  const { isLoading, navigation, session, passwordPromptProps, actions } =
    useAppFlow();

  if (isLoading || navigation.screen === SCREENS.LOADING) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={palette.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <PasswordPromptModal {...passwordPromptProps} />
      <AppScreens navigation={navigation} session={session} actions={actions} />
    </SafeAreaView>
  );
}

// Raiz do app: área segura da tela e o provedor de alertas
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
