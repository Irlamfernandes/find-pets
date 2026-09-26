import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { SafeTouchable } from '../../../shared/components/SafeTouchable';
import { dismissKeyboardAnd } from '../../../shared/utils/keyboard';
import { palette } from '../../../shared/theme/colors';

export function ProfileHeader({ onBack, onLogout }) {
  return (
    <View style={styles.header}>
      <SafeTouchable
        accessibilityLabel="Voltar"
        onPress={dismissKeyboardAnd(onBack)}
        style={styles.backButton}
      >
        <Text style={styles.backText}>←</Text>
      </SafeTouchable>
      <View style={styles.titleContainer}>
        <Image
          source={require('../../../../assets/adaptive-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Editar Perfil</Text>
      </View>
      {onLogout ? (
        <SafeTouchable
          onPress={dismissKeyboardAnd(onLogout)}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutText}>Sair</Text>
        </SafeTouchable>
      ) : null}
    </View>
  );
}

ProfileHeader.propTypes = {
  onBack: PropTypes.func,
  onLogout: PropTypes.func,
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.cardBorder,
  },
  backButton: { padding: 4 },
  backText: { fontSize: 20, color: palette.primary, fontWeight: 'bold' },
  titleContainer: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 30, height: 30, marginRight: 8 },
  title: { fontSize: 18, fontWeight: 'bold', color: palette.text },
  logoutButton: {
    backgroundColor: palette.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  logoutText: { color: palette.text, fontWeight: 'bold', fontSize: 12 },
});
