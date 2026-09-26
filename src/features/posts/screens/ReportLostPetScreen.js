import React from 'react';
import { Text, StyleSheet, ActivityIndicator, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PropTypes from 'prop-types';
import { SafeTouchable } from '../../../shared/components/SafeTouchable';
import { ScreenHeader } from '../../../shared/components/ScreenHeader';
import { LabeledInput } from '../../../shared/components/LabeledInput';
import { FormScrollView } from '../../../shared/components/FormScrollView';
import { useBackHandler } from '../../../shared/hooks/useBackHandler';
import { dismissKeyboardAnd } from '../../../shared/utils/keyboard';
import { formStyles } from '../../../shared/theme/formStyles';
import { palette } from '../../../shared/theme/colors';
import { useReportLostPet, MAX_PHOTOS } from '../hooks/useReportLostPet';
import { PetPhotosField } from '../components/PetPhotosField';
import { PetDetailsFields } from '../components/PetDetailsFields';

// Textos que mudam entre criar um registro e editar um existente
const CREATE_COPY = {
  title: 'Registrar desaparecimento',
  photosHint:
    'A localização e a data/hora das fotos serão usadas no registro, quando disponíveis.',
  addressLabel: 'Endereço (opcional)',
  addressHint:
    'Sem endereço, usamos a localização da foto ou a sua localização atual.',
  submit: 'Registrar desaparecimento',
};

const EDIT_COPY = {
  title: 'Editar registro',
  photosHint: 'Adicione ou remova fotos do registro.',
  addressLabel: 'Endereço',
  addressHint: 'Mudar o endereço atualiza o ponto no mapa.',
  submit: 'Salvar alterações',
};

export default function ReportLostPetScreen({
  onBack,
  onSaved,
  initialPost = null,
}) {
  const report = useReportLostPet(onSaved, initialPost);
  const copy = report.isEditing ? EDIT_COPY : CREATE_COPY;
  useBackHandler(dismissKeyboardAnd(onBack));

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={copy.title} onBack={onBack} />

      <FormScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
      >
        <PetPhotosField
          photos={report.photos}
          maxPhotos={MAX_PHOTOS}
          canAdd={report.remainingPhotos > 0}
          hint={copy.photosHint}
          onTakePhoto={report.takePhoto}
          onPickGallery={report.pickFromGallery}
          onRemove={report.removePhoto}
        />

        <Text style={styles.sectionTitle}>Sobre o pet</Text>
        <PetDetailsFields
          petData={report.petData}
          onChange={report.setPetField}
        />

        <Text style={styles.sectionTitle}>Onde desapareceu</Text>
        <LabeledInput
          label={copy.addressLabel}
          testID="input-address"
          value={report.address}
          onChangeText={report.setAddress}
          placeholder="Rua, número, bairro, cidade"
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        <Text style={formStyles.hint}>{copy.addressHint}</Text>

        <SafeTouchable
          testID="button-submit-report"
          style={[
            formStyles.primaryButton,
            report.isSaving && styles.submitDisabled,
          ]}
          disabled={report.isSaving}
          onPress={dismissKeyboardAnd(report.submit)}
        >
          {report.isSaving ? (
            <ActivityIndicator color={palette.white} />
          ) : (
            <Text style={formStyles.primaryButtonText}>{copy.submit}</Text>
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
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: palette.text,
    marginTop: 28,
  },
  submitDisabled: { opacity: 0.7 },
});
