import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SafeTouchable } from './SafeTouchable';
import { palette } from '../theme/colors';

export function UserAvatar({ uri, size = 40, onPress, accessibilityLabel }) {
  const shape = { width: size, height: size, borderRadius: size / 2 };

  const content = uri ? (
    <Image testID="user-avatar-image" source={{ uri }} style={shape} />
  ) : (
    <View testID="user-avatar-placeholder" style={[styles.placeholder, shape]}>
      <Ionicons name="person" size={size * 0.55} color={palette.primary} />
    </View>
  );

  if (!onPress) return content;

  return (
    <SafeTouchable
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {content}
    </SafeTouchable>
  );
}

UserAvatar.propTypes = {
  uri: PropTypes.string,
  size: PropTypes.number,
  onPress: PropTypes.func,
  accessibilityLabel: PropTypes.string,
};

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
});
