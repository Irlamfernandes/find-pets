import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import { palette } from '../theme/colors';

// Aviso exibido só quando o celular está sem internet: o app continua
// funcionando e envia as alterações quando a conexão voltar
export function OfflineBanner() {
  const { isConnected } = useNetInfo();
  if (isConnected !== false) return null;

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Ionicons name="cloud-offline-outline" size={18} color={palette.text} />
      <Text style={styles.text}>
        Você está sem internet. Suas alterações ficam salvas no celular e são
        enviadas quando a conexão voltar.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: palette.accentSoft,
  },
  text: { flex: 1, fontSize: 13, color: palette.text },
});
