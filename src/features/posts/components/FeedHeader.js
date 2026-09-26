import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SafeTouchable } from '../../../shared/components/SafeTouchable';
import { UserAvatar } from '../../../shared/components/UserAvatar';
import { palette } from '../../../shared/theme/colors';

export function FeedHeader({
  userName,
  userPhoto,
  onShowGuide,
  onOpenProfile,
}) {
  return (
    <View style={styles.header}>
      <Image
        source={require('../../../../assets/adaptive-icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.titleContainer}>
        <Text style={styles.title}>FindPets</Text>
        {userName ? <Text style={styles.welcome}>Olá, {userName}</Text> : null}
      </View>
      {onShowGuide ? (
        <SafeTouchable
          accessibilityLabel="Como funciona o app"
          style={styles.helpButton}
          onPress={onShowGuide}
        >
          <Ionicons
            name="help-circle-outline"
            size={28}
            color={palette.primary}
          />
        </SafeTouchable>
      ) : null}
      <UserAvatar
        uri={userPhoto}
        size={42}
        accessibilityLabel="Abrir meu perfil"
        onPress={onOpenProfile}
      />
    </View>
  );
}

FeedHeader.propTypes = {
  userName: PropTypes.string,
  userPhoto: PropTypes.string,
  // Sem a função, o botão de ajuda fica escondido
  onShowGuide: PropTypes.func,
  onOpenProfile: PropTypes.func,
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.cardBorder,
  },
  logo: { width: 34, height: 34, marginRight: 10 },
  titleContainer: { flex: 1 },
  title: { fontSize: 20, fontWeight: 'bold', color: palette.text },
  welcome: { fontSize: 13, color: palette.textMuted, marginTop: 2 },
  helpButton: { padding: 4, marginRight: 8 },
});
