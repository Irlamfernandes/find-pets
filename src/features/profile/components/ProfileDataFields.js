import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SafeTouchable } from '../../../shared/components/SafeTouchable';
import { LabeledInput } from '../../../shared/components/LabeledInput';
import { dismissKeyboardAnd } from '../../../shared/utils/keyboard';
import { formStyles } from '../../../shared/theme/formStyles';
import { palette } from '../../../shared/theme/colors';

// "Meus dados": nome e WhatsApp, travados até a pessoa tocar no lápis
export function ProfileDataFields({
  values,
  isEditing,
  whatsappRef,
  onChange,
  onRequestEdit,
  onWhatsappSubmit,
}) {
  const lockedStyle = !isEditing && formStyles.inputLocked;

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Meus dados</Text>
        {isEditing ? null : (
          <SafeTouchable
            testID="button-edit-profile"
            accessibilityLabel="Editar perfil"
            style={styles.editButton}
            onPress={dismissKeyboardAnd(onRequestEdit)}
          >
            <Ionicons name="create-outline" size={20} color={palette.primary} />
          </SafeTouchable>
        )}
      </View>

      <LabeledInput
        label="Nome"
        style={lockedStyle}
        value={values.name}
        onChangeText={(text) => onChange('name', text)}
        placeholder="Seu nome"
        editable={isEditing}
        onSubmit={() => whatsappRef.current?.focus()}
      />

      <LabeledInput
        label="WhatsApp"
        ref={whatsappRef}
        style={lockedStyle}
        value={values.whatsapp}
        onChangeText={(text) => onChange('whatsapp', text)}
        placeholder="Seu WhatsApp"
        editable={isEditing}
        keyboardType="phone-pad"
        maxLength={19}
        onSubmit={onWhatsappSubmit}
      />
    </>
  );
}

ProfileDataFields.propTypes = {
  values: PropTypes.shape({
    name: PropTypes.string.isRequired,
    whatsapp: PropTypes.string.isRequired,
  }).isRequired,
  isEditing: PropTypes.bool.isRequired,
  whatsappRef: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onRequestEdit: PropTypes.func.isRequired,
  onWhatsappSubmit: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: palette.text },
  editButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: palette.primarySoft,
  },
});
