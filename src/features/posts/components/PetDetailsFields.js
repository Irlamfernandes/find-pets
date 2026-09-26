import React, { useRef } from 'react';
import { Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { ChipSelector } from '../../../shared/components/ChipSelector';
import { LabeledInput } from '../../../shared/components/LabeledInput';
import { formStyles } from '../../../shared/theme/formStyles';
import {
  SPECIES_OPTIONS,
  SIZE_OPTIONS,
  SEX_OPTIONS,
} from '../constants/petOptions';

// Seção "Sobre o pet": espécie (obrigatória), nome, porte, sexo, cor, raça e
// detalhes
export function PetDetailsFields({ petData, onChange }) {
  const breedRef = useRef(null);
  const descriptionRef = useRef(null);
  const bind = (field) => ({
    value: petData[field],
    onChangeText: (text) => onChange(field, text),
  });

  return (
    <>
      <Text style={formStyles.label}>Espécie *</Text>
      <ChipSelector
        options={SPECIES_OPTIONS}
        value={petData.species}
        onChange={(value) => onChange('species', value)}
        required
      />

      <LabeledInput
        label="Nome (opcional)"
        testID="input-pet-name"
        {...bind('petName')}
        placeholder="Como ele atende? Ex.: Rex"
        maxLength={40}
        returnKeyType="done"
      />

      <Text style={formStyles.label}>Porte</Text>
      <ChipSelector
        options={SIZE_OPTIONS}
        value={petData.size}
        onChange={(value) => onChange('size', value)}
      />

      <Text style={formStyles.label}>Sexo</Text>
      <ChipSelector
        options={SEX_OPTIONS}
        value={petData.sex}
        onChange={(value) => onChange('sex', value)}
      />

      <LabeledInput
        label="Cor"
        testID="input-pet-color"
        {...bind('color')}
        placeholder="Ex.: caramelo com manchas brancas"
        maxLength={60}
        onSubmit={() => breedRef.current?.focus()}
      />

      <LabeledInput
        label="Raça (opcional)"
        ref={breedRef}
        testID="input-pet-breed"
        {...bind('breed')}
        placeholder="Ex.: vira-lata, poodle, siamês"
        maxLength={40}
        onSubmit={() => descriptionRef.current?.focus()}
      />

      <LabeledInput
        label="Mais detalhes (opcional)"
        ref={descriptionRef}
        testID="input-description"
        style={styles.textArea}
        {...bind('description')}
        placeholder="Coleira, comportamento, onde foi visto pela última vez..."
        multiline
        textAlignVertical="top"
        maxLength={500}
      />
    </>
  );
}

PetDetailsFields.propTypes = {
  petData: PropTypes.objectOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  textArea: { minHeight: 110 },
});
