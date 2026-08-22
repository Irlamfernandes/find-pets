import React from 'react';
import { StyleSheet, StatusBar, Alert } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';

export default function App() {
  const handleLoginSuccess = (data) => {
    if (data.type === 'biometric') {
      Alert.alert('Sucesso!', 'Login realizado via Biometria com sucesso.');
    } else {
      Alert.alert('Sucesso!', `Bem-vindo de volta, ${data.email}!`);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
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
