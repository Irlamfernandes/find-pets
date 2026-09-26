import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SafeTouchable } from '../../../shared/components/SafeTouchable';
import { UserAvatar } from '../../../shared/components/UserAvatar';
import { OptionsSheet } from '../../../shared/components/OptionsSheet';
import { PhotoViewerModal } from '../../../shared/components/PhotoViewerModal';
import { dismissKeyboardAnd } from '../../../shared/utils/keyboard';
import { palette } from '../../../shared/theme/colors';
import {
  getPhotoOptions,
  useProfilePhotoPicker,
} from '../hooks/useProfilePhotoPicker';

// Foto do perfil: tocar abre em tela cheia; no modo de edição, o botão da
// câmera permite trocar ou remover
export function ProfilePhotoSection({ photoUri, isEditing, onChange }) {
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const choosePhoto = useProfilePhotoPicker(onChange);

  const options = getPhotoOptions({
    hasPhoto: Boolean(photoUri),
    onChoose: choosePhoto,
    onRemove: () => onChange(null),
  });

  return (
    <View style={styles.section}>
      <UserAvatar
        uri={photoUri}
        size={112}
        accessibilityLabel="Ver foto do perfil em tela cheia"
        onPress={
          photoUri
            ? dismissKeyboardAnd(() => setIsViewerVisible(true))
            : undefined
        }
      />
      {isEditing ? (
        <SafeTouchable
          testID="button-change-photo"
          accessibilityLabel="Alterar foto do perfil"
          style={styles.changeButton}
          onPress={dismissKeyboardAnd(() => setIsOptionsVisible(true))}
        >
          <Ionicons name="camera" size={18} color={palette.white} />
        </SafeTouchable>
      ) : null}

      <OptionsSheet
        visible={isOptionsVisible}
        title="Foto do perfil"
        options={options}
        onClose={() => setIsOptionsVisible(false)}
      />

      <PhotoViewerModal
        images={isViewerVisible && photoUri ? [photoUri] : []}
        onClose={() => setIsViewerVisible(false)}
      />
    </View>
  );
}

ProfilePhotoSection.propTypes = {
  photoUri: PropTypes.string,
  isEditing: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  section: { alignSelf: 'center', marginBottom: 12 },
  changeButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
    borderWidth: 2,
    borderColor: palette.surface,
  },
});
