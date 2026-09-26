import React, { useState, useRef } from 'react';
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
import { SafeTouchable } from './SafeTouchable';
import { palette } from '../theme/colors';
import {
  formatDateInput,
  formatTimeInput,
  toDateInput,
  toTimeInput,
  parseDateTimeInput,
} from '../utils/dateTimeMask';
import { getTimeZoneInfo } from '../utils/timeZone';
import { FormScrollView, FormTextInput } from './FormScrollView';
import { dismissKeyboardAnd } from '../utils/keyboard';

export const FOUND_RELATIONS = [
  'Dono(a) / tutor',
  'Familiar',
  'Vizinho / conhecido',
  'Abrigo / ONG',
  'Outro',
];

function createInitialForm() {
  const now = new Date();
  return {
    receiverName: '',
    receiverRelation: FOUND_RELATIONS[0],
    date: toDateInput(now),
    time: toTimeInput(now),
    foundLocation: '',
    notes: '',
  };
}

export function FoundPetModal({ visible, onCancel, onConfirm }) {
  const [form, setForm] = useState(createInitialForm);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const dateRef = useRef(null);
  const timeRef = useRef(null);
  const locationRef = useRef(null);
  const notesRef = useRef(null);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleShow = () => {
    setForm(createInitialForm());
    setErrorMessage('');
  };

  const handleConfirm = async () => {
    if (!form.receiverName.trim()) {
      setErrorMessage('Informe o nome de quem pegou o animal.');
      return;
    }

    const foundAt = parseDateTimeInput(form.date, form.time);
    if (!foundAt) {
      setErrorMessage('Informe uma data (dd/mm/aaaa) e hora (HH:MM) válidas.');
      return;
    }
    if (foundAt > new Date()) {
      setErrorMessage('A data do reencontro não pode estar no futuro.');
      return;
    }

    setErrorMessage('');
    setIsSaving(true);
    try {
      await onConfirm({
        receiverName: form.receiverName.trim(),
        receiverRelation: form.receiverRelation,
        foundAt: foundAt.toISOString(),
        foundZone: getTimeZoneInfo(foundAt),
        foundLocation: form.foundLocation.trim(),
        notes: form.notes.trim(),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onShow={handleShow}
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView style={styles.overlay} behavior="padding">
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="heart" size={22} color={palette.success} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Pet encontrado!</Text>
              <Text style={styles.subtitle}>
                Registre como foi o reencontro.
              </Text>
            </View>
          </View>

          <FormScrollView>
            <Text style={styles.label}>Nome de quem pegou o animal</Text>
            <FormTextInput
              testID="input-receiver-name"
              style={styles.input}
              value={form.receiverName}
              onChangeText={(text) => updateField('receiverName', text)}
              placeholder="Ex.: Maria Silva"
              selectionColor={palette.primary}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => dateRef.current?.focus()}
            />

            <Text style={styles.label}>Quem é essa pessoa?</Text>
            <View style={styles.chips}>
              {FOUND_RELATIONS.map((relation) => {
                const selected = form.receiverRelation === relation;
                return (
                  <SafeTouchable
                    key={relation}
                    accessibilityState={{ selected }}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={dismissKeyboardAnd(() =>
                      updateField('receiverRelation', relation)
                    )}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}
                    >
                      {relation}
                    </Text>
                  </SafeTouchable>
                );
              })}
            </View>

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Data</Text>
                <FormTextInput
                  ref={dateRef}
                  testID="input-found-date"
                  style={styles.input}
                  value={form.date}
                  onChangeText={(text) =>
                    updateField('date', formatDateInput(text))
                  }
                  placeholder="dd/mm/aaaa"
                  keyboardType="number-pad"
                  maxLength={10}
                  selectionColor={palette.primary}
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => timeRef.current?.focus()}
                />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Hora</Text>
                <FormTextInput
                  ref={timeRef}
                  testID="input-found-time"
                  style={styles.input}
                  value={form.time}
                  onChangeText={(text) =>
                    updateField('time', formatTimeInput(text))
                  }
                  placeholder="HH:MM"
                  keyboardType="number-pad"
                  maxLength={5}
                  selectionColor={palette.primary}
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => locationRef.current?.focus()}
                />
              </View>
            </View>

            <Text style={styles.label}>Onde foi encontrado (opcional)</Text>
            <FormTextInput
              ref={locationRef}
              testID="input-found-location"
              style={styles.input}
              value={form.foundLocation}
              onChangeText={(text) => updateField('foundLocation', text)}
              placeholder="Rua, bairro ou ponto de referência"
              selectionColor={palette.primary}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => notesRef.current?.focus()}
            />

            <Text style={styles.label}>Observações (opcional)</Text>
            <FormTextInput
              ref={notesRef}
              testID="input-found-notes"
              style={[styles.input, styles.textArea]}
              value={form.notes}
              onChangeText={(text) => updateField('notes', text)}
              placeholder="Como ele estava, quem ajudou, recompensa..."
              multiline
              textAlignVertical="top"
              maxLength={300}
              selectionColor={palette.primary}
            />

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}
          </FormScrollView>

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
              onPress={dismissKeyboardAnd(handleConfirm)}
            >
              {isSaving ? (
                <ActivityIndicator color={palette.white} />
              ) : (
                <Text style={styles.confirmText}>Confirmar reencontro</Text>
              )}
            </SafeTouchable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

FoundPetModal.propTypes = {
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
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: palette.text,
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: palette.text,
  },
  textArea: { minHeight: 80 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: palette.background,
  },
  chipSelected: {
    borderColor: palette.success,
    backgroundColor: '#D1FAE5',
  },
  chipText: { fontSize: 13, color: palette.text },
  chipTextSelected: { fontWeight: 'bold' },
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
