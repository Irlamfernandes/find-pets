import React, { useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SafeTouchable } from '../../../shared/components/SafeTouchable';
import { ChipSelector } from '../../../shared/components/ChipSelector';
import { LabeledInput } from '../../../shared/components/LabeledInput';
import { FormScrollView } from '../../../shared/components/FormScrollView';
import { palette } from '../../../shared/theme/colors';
import { formStyles } from '../../../shared/theme/formStyles';
import {
  formatDateInput,
  formatTimeInput,
} from '../../../shared/utils/dateTimeMask';
import { dismissKeyboardAnd } from '../../../shared/utils/keyboard';
import { FOUND_RELATIONS } from '../domain/foundForm';
import { useFoundForm } from '../hooks/useFoundForm';

export { FOUND_RELATIONS } from '../domain/foundForm';

function FoundModalHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.headerIcon}>
        <Ionicons name="heart" size={22} color={palette.success} />
      </View>
      <View style={styles.headerText}>
        <Text style={styles.title}>Pet encontrado!</Text>
        <Text style={styles.subtitle}>Registre como foi o reencontro.</Text>
      </View>
    </View>
  );
}

function FoundDateTimeFields({ form, dateRef, timeRef, onChange, onSubmit }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowItem}>
        <LabeledInput
          label="Data"
          ref={dateRef}
          testID="input-found-date"
          value={form.date}
          onChangeText={(text) => onChange('date', formatDateInput(text))}
          placeholder="dd/mm/aaaa"
          keyboardType="number-pad"
          maxLength={10}
          onSubmit={() => timeRef.current?.focus()}
        />
      </View>
      <View style={styles.rowItem}>
        <LabeledInput
          label="Hora"
          ref={timeRef}
          testID="input-found-time"
          value={form.time}
          onChangeText={(text) => onChange('time', formatTimeInput(text))}
          placeholder="HH:MM"
          keyboardType="number-pad"
          maxLength={5}
          onSubmit={onSubmit}
        />
      </View>
    </View>
  );
}

FoundDateTimeFields.propTypes = {
  form: PropTypes.shape({
    date: PropTypes.string.isRequired,
    time: PropTypes.string.isRequired,
  }).isRequired,
  dateRef: PropTypes.object.isRequired,
  timeRef: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

function FoundModalActions({ isSaving, onCancel, onConfirm }) {
  return (
    <View style={styles.actions}>
      <SafeTouchable
        style={[styles.button, styles.cancelButton]}
        onPress={dismissKeyboardAnd(onCancel)}
      >
        <Text style={styles.cancelText}>Cancelar</Text>
      </SafeTouchable>
      <SafeTouchable
        testID="button-confirm-found"
        style={[styles.button, styles.confirmButton]}
        disabled={isSaving}
        onPress={dismissKeyboardAnd(onConfirm)}
      >
        {isSaving ? (
          <ActivityIndicator color={palette.white} />
        ) : (
          <Text style={styles.confirmText}>Confirmar reencontro</Text>
        )}
      </SafeTouchable>
    </View>
  );
}

FoundModalActions.propTypes = {
  isSaving: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export function FoundPetModal({ visible, lostAt, onCancel, onConfirm }) {
  const { form, updateField, errorMessage, isSaving, reset, confirm } =
    useFoundForm(onConfirm, lostAt);
  const dateRef = useRef(null);
  const timeRef = useRef(null);
  const locationRef = useRef(null);
  const notesRef = useRef(null);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onShow={reset}
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView style={styles.overlay} behavior="padding">
        <View style={styles.sheet}>
          <FoundModalHeader />

          <FormScrollView>
            <LabeledInput
              label="Nome de quem pegou o animal"
              testID="input-receiver-name"
              value={form.receiverName}
              onChangeText={(text) => updateField('receiverName', text)}
              placeholder="Ex.: Maria Silva"
              onSubmit={() => dateRef.current?.focus()}
            />

            <Text style={formStyles.label}>Quem é essa pessoa?</Text>
            <ChipSelector
              options={FOUND_RELATIONS}
              value={form.receiverRelation}
              onChange={(relation) => updateField('receiverRelation', relation)}
              required
            />

            <FoundDateTimeFields
              form={form}
              dateRef={dateRef}
              timeRef={timeRef}
              onChange={updateField}
              onSubmit={() => locationRef.current?.focus()}
            />

            <LabeledInput
              label="Onde foi encontrado (opcional)"
              ref={locationRef}
              testID="input-found-location"
              value={form.foundLocation}
              onChangeText={(text) => updateField('foundLocation', text)}
              placeholder="Rua, bairro ou ponto de referência"
              onSubmit={() => notesRef.current?.focus()}
            />

            <LabeledInput
              label="Observações (opcional)"
              ref={notesRef}
              testID="input-found-notes"
              style={styles.textArea}
              value={form.notes}
              onChangeText={(text) => updateField('notes', text)}
              placeholder="Como ele estava, quem ajudou, recompensa..."
              multiline
              textAlignVertical="top"
              maxLength={300}
            />

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}
          </FormScrollView>

          <FoundModalActions
            isSaving={isSaving}
            onCancel={onCancel}
            onConfirm={confirm}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

FoundPetModal.propTypes = {
  // Data do desaparecimento (ISO), quando conhecida
  lostAt: PropTypes.string,
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    maxHeight: '90%',
    backgroundColor: palette.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: { flex: 1 },
  title: { fontSize: 18, fontWeight: 'bold', color: palette.text },
  subtitle: { fontSize: 13, color: palette.textMuted, marginTop: 2 },
  textArea: { minHeight: 80 },
  row: { flexDirection: 'row', gap: 10 },
  rowItem: { flex: 1 },
  errorText: { color: palette.error, fontSize: 13, marginTop: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: { backgroundColor: palette.background },
  confirmButton: { backgroundColor: palette.success },
  cancelText: { color: palette.text, fontWeight: 'bold' },
  confirmText: { color: palette.white, fontWeight: 'bold' },
});
