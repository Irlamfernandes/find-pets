// App.js
import 'react-native-get-random-values';
import React from 'react';
import { StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { palette } from './src/shared/theme/colors';
import { AppAlertProvider } from './src/shared/components/AppAlert';
import PasswordPromptModal from './src/shared/components/PasswordPromptModal';
import { useAppFlow } from './src/app/useAppFlow';
import { AppScreens } from './src/app/AppScreens';
import { SCREENS } from './src/app/navigation';

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
      <StatusBar barStyle="dark-content" backgroundColor={palette.background} />
      <PasswordPromptModal {...passwordPromptProps} />
      <AppScreens navigation={navigation} session={session} actions={actions} />
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
