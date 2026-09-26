import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SafeTouchable } from '../../../shared/components/SafeTouchable';
import { dismissKeyboardAnd } from '../../../shared/utils/keyboard';
import { formStyles } from '../../../shared/theme/formStyles';
import { palette } from '../../../shared/theme/colors';

function AddPhotoButton({ testID, icon, label, onPress }) {
  return (
    <SafeTouchable
      testID={testID}
      style={styles.addButton}
      onPress={dismissKeyboardAnd(onPress)}
    >
      <Ionicons name={icon} size={26} color={palette.primary} />
      <Text style={styles.addText}>{label}</Text>
    </SafeTouchable>
  );
}

AddPhotoButton.propTypes = {
  testID: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
};

// Fotos do registro em linha, com botões para fotografar ou escolher da
// galeria enquanto houver espaço
export function PetPhotosField({
  photos,
  maxPhotos,
  canAdd,
  hint,
  onTakePhoto,
  onPickGallery,
  onRemove,
}) {
  return (
    <>
      <Text style={formStyles.label}>
        Fotos do pet ({photos.length}/{maxPhotos})
      </Text>
      <Text style={formStyles.hint}>{hint}</Text>

      <ScrollView
        horizontal
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {photos.map((photo, index) => (
          <View key={photo.uri}>
            <Image
              testID="report-photo"
              source={{ uri: photo.uri }}
              style={styles.photo}
            />
            <SafeTouchable
              accessibilityLabel={`Remover foto ${index + 1}`}
              style={styles.removeButton}
              onPress={dismissKeyboardAnd(() => onRemove(photo.uri))}
            >
              <Ionicons name="close" size={16} color={palette.white} />
            </SafeTouchable>
          </View>
        ))}

        {canAdd ? (
          <>
            <AddPhotoButton
              testID="button-take-photo"
              icon="camera-outline"
              label="Tirar foto"
              onPress={onTakePhoto}
            />
            <AddPhotoButton
              testID="button-pick-gallery"
              icon="images-outline"
              label="Galeria"
              onPress={onPickGallery}
            />
          </>
        ) : null}
      </ScrollView>
    </>
  );
}

PetPhotosField.propTypes = {
  photos: PropTypes.arrayOf(PropTypes.shape({ uri: PropTypes.string }))
    .isRequired,
  maxPhotos: PropTypes.number.isRequired,
  canAdd: PropTypes.bool.isRequired,
  hint: PropTypes.string.isRequired,
  onTakePhoto: PropTypes.func.isRequired,
  onPickGallery: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  list: { gap: 10, paddingVertical: 10 },
  photo: { width: 96, height: 96, borderRadius: 12 },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 999,
    padding: 3,
  },
  addButton: {
    width: 96,
    height: 96,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: palette.primary,
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addText: { color: palette.primary, fontSize: 12, fontWeight: 'bold' },
});
