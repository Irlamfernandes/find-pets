import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SafeTouchable } from '../../../shared/components/SafeTouchable';
import { useReportLostPet, MAX_PHOTOS } from '../hooks/useReportLostPet';
import { palette } from '../../../shared/theme/colors';
import {
  FormScrollView,
  FormTextInput,
} from '../../../shared/components/FormScrollView';
import { dismissKeyboardAnd } from '../../../shared/utils/keyboard';
import { useBackHandler } from '../../../shared/hooks/useBackHandler';
import { ChipSelector } from '../../../shared/components/ChipSelector';
import {
  SPECIES_OPTIONS,
  SIZE_OPTIONS,
  SEX_OPTIONS,
} from '../constants/petOptions';

export default function ReportLostPetScreen({
  onBack,
  onSaved,
  initialPost = null,
}) {
  const {
    isEditing,
    photos,
    petData,
    setPetField,
    address,
    setAddress,
    isSaving,
    remainingPhotos,
    pickFromGallery,
    takePhoto,
    removePhoto,
    submit,
  } = useReportLostPet(onSaved, initialPost);
  useBackHandler(dismissKeyboardAnd(onBack));
  const breedRef = useRef(null);
  const descriptionRef = useRef(null);

  const canAddPhotos = remainingPhotos > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <SafeTouchable
          testID="button-back"
          accessibilityLabel="Voltar"
          onPress={dismissKeyboardAnd(onBack)}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color={palette.primary} />
        </SafeTouchable>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Editar registro' : 'Registrar desaparecimento'}
        </Text>
      </View>

      <FormScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.label}>
          Fotos do pet ({photos.length}/{MAX_PHOTOS})
        </Text>
        <Text style={styles.hint}>
          {isEditing
            ? 'Adicione ou remova fotos do registro.'
            : 'A localização e a data/hora das fotos serão usadas no registro, quando disponíveis.'}
        </Text>

        <ScrollView
          horizontal
          keyboardShouldPersistTaps="handled"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photoList}
        >
          {photos.map((photo, index) => (
            <View key={photo.uri} style={styles.photoItem}>
              <Image
                testID="report-photo"
                source={{ uri: photo.uri }}
                style={styles.photo}
              />
              <SafeTouchable
                accessibilityLabel={`Remover foto ${index + 1}`}
                style={styles.removePhotoButton}
                onPress={dismissKeyboardAnd(() => removePhoto(photo.uri))}
              >
                <Ionicons name="close" size={16} color={palette.white} />
              </SafeTouchable>
            </View>
          ))}

          {canAddPhotos ? (
            <>
              <SafeTouchable
                testID="button-take-photo"
                style={styles.addPhotoButton}
                onPress={dismissKeyboardAnd(takePhoto)}
              >
                <Ionicons
                  name="camera-outline"
                  size={26}
                  color={palette.primary}
                />
                <Text style={styles.addPhotoText}>Tirar foto</Text>
              </SafeTouchable>
              <SafeTouchable
                testID="button-pick-gallery"
                style={styles.addPhotoButton}
                onPress={dismissKeyboardAnd(pickFromGallery)}
              >
                <Ionicons
                  name="images-outline"
                  size={26}
                  color={palette.primary}
                />
                <Text style={styles.addPhotoText}>Galeria</Text>
              </SafeTouchable>
            </>
          ) : null}
        </ScrollView>

        <Text style={styles.sectionTitle}>Sobre o pet</Text>

        <Text style={styles.label}>Espécie *</Text>
        <ChipSelector
          options={SPECIES_OPTIONS}
          value={petData.species}
          onChange={(value) => setPetField('species', value)}
          required
        />

        <Text style={styles.label}>Nome (opcional)</Text>
        <FormTextInput
          testID="input-pet-name"
          style={styles.input}
          value={petData.petName}
          onChangeText={(text) => setPetField('petName', text)}
          placeholder="Como ele atende? Ex.: Rex"
          maxLength={40}
          selectionColor={palette.primary}
          returnKeyType="done"
        />

        <Text style={styles.label}>Porte</Text>
        <ChipSelector
          options={SIZE_OPTIONS}
          value={petData.size}
          onChange={(value) => setPetField('size', value)}
        />

        <Text style={styles.label}>Sexo</Text>
        <ChipSelector
          options={SEX_OPTIONS}
          value={petData.sex}
          onChange={(value) => setPetField('sex', value)}
        />

        <Text style={styles.label}>Cor</Text>
        <FormTextInput
          testID="input-pet-color"
          style={styles.input}
          value={petData.color}
          onChangeText={(text) => setPetField('color', text)}
          placeholder="Ex.: caramelo com manchas brancas"
          maxLength={60}
          selectionColor={palette.primary}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => breedRef.current?.focus()}
        />

        <Text style={styles.label}>Raça (opcional)</Text>
        <FormTextInput
          ref={breedRef}
          testID="input-pet-breed"
          style={styles.input}
          value={petData.breed}
          onChangeText={(text) => setPetField('breed', text)}
          placeholder="Ex.: vira-lata, poodle, siamês"
          maxLength={40}
          selectionColor={palette.primary}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => descriptionRef.current?.focus()}
        />

        <Text style={styles.label}>Mais detalhes (opcional)</Text>
        <FormTextInput
          ref={descriptionRef}
          testID="input-description"
          style={[styles.input, styles.textArea]}
          value={petData.description}
          onChangeText={(text) => setPetField('description', text)}
          placeholder="Coleira, comportamento, onde foi visto pela última vez..."
          multiline
          textAlignVertical="top"
          maxLength={500}
          selectionColor={palette.primary}
        />

        <Text style={styles.sectionTitle}>Onde desapareceu</Text>
        <Text style={styles.label}>
          Endereço{isEditing ? '' : ' (opcional)'}
        </Text>
        <FormTextInput
          testID="input-address"
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Rua, número, bairro, cidade"
          selectionColor={palette.primary}
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        <Text style={styles.hint}>
          {isEditing
            ? 'Mudar o endereço atualiza o ponto no mapa.'
            : 'Sem endereço, usamos a localização da foto ou a sua localização atual.'}
        </Text>

        <SafeTouchable
          testID="button-submit-report"
          style={[styles.submitButton, isSaving && styles.submitDisabled]}
          disabled={isSaving}
          onPress={dismissKeyboardAnd(submit)}
        >
          {isSaving ? (
            <ActivityIndicator color={palette.white} />
          ) : (
            <Text style={styles.submitText}>
              {isEditing ? 'Salvar alterações' : 'Registrar desaparecimento'}
            </Text>
          )}
        </SafeTouchable>
      </FormScrollView>
    </SafeAreaView>
  );
}

ReportLostPetScreen.propTypes = {
  onBack: PropTypes.func.isRequired,
  onSaved: PropTypes.func.isRequired,
  initialPost: PropTypes.object,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.cardBorder,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: palette.text },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: palette.text,
    marginTop: 28,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: palette.text,
    marginTop: 16,
    marginBottom: 6,
  },
  hint: { fontSize: 12, color: palette.textMuted, marginTop: 4 },
  photoList: { gap: 10, paddingVertical: 10 },
  photoItem: { position: 'relative' },
  photo: { width: 96, height: 96, borderRadius: 12 },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 999,
    padding: 3,
  },
  addPhotoButton: {
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
  addPhotoText: { color: palette.primary, fontSize: 12, fontWeight: 'bold' },
  input: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: palette.text,
  },
  textArea: { minHeight: 110 },
  submitButton: {
    backgroundColor: palette.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: palette.white, fontSize: 16, fontWeight: 'bold' },
});
