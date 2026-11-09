import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { ChipSelector } from '../../../shared/components/ChipSelector';
import { formStyles } from '../../../shared/theme/formStyles';

export function BreedSuggestions({ suggestions, onSelect }) {
  if (suggestions.length === 0) return null;

  return (
    <View testID="breed-suggestions" style={styles.container}>
      <Text style={formStyles.hint}>Sugestões de raça</Text>
      <ChipSelector options={suggestions} value="" onChange={onSelect} />
    </View>
  );
}

BreedSuggestions.propTypes = {
  suggestions: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSelect: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  container: { gap: 8, marginBottom: 8 },
});
