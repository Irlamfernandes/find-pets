import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { ChipSelector } from '../../../shared/components/ChipSelector';
import { SafeTouchable } from '../../../shared/components/SafeTouchable';
import { palette } from '../../../shared/theme/colors';
import { ALL_SPECIES } from '../domain/feedFilter';
import { SPECIES_OPTIONS } from '../constants/petOptions';

const SPECIES_FILTERS = [ALL_SPECIES, ...SPECIES_OPTIONS];

export function FeedFilters({ species, text, onChangeSpecies, onChangeText }) {
  return (
    <View testID="feed-filters" style={styles.container}>
      <View style={styles.search}>
        <Ionicons name="search" size={18} color={palette.textMuted} />
        <TextInput
          testID="input-feed-search"
          style={styles.searchInput}
          value={text}
          onChangeText={onChangeText}
          placeholder="Buscar por nome, raça, cor ou lugar"
          placeholderTextColor={palette.textMuted}
          selectionColor={palette.primary}
          returnKeyType="search"
        />
      </View>
      <ChipSelector
        options={SPECIES_FILTERS}
        value={species}
        onChange={onChangeSpecies}
        required
      />
    </View>
  );
}

FeedFilters.propTypes = {
  species: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  onChangeSpecies: PropTypes.func.isRequired,
  onChangeText: PropTypes.func.isRequired,
};

export function FilterEmptyState({ onClear }) {
  return (
    <View testID="feed-filter-empty" style={styles.empty}>
      <Ionicons name="paw-outline" size={32} color={palette.textMuted} />
      <Text style={styles.emptyText}>
        Nenhum pet encontrado com esses filtros.
      </Text>
      <SafeTouchable
        testID="button-clear-filters"
        style={styles.clearButton}
        onPress={onClear}
      >
        <Text style={styles.clearText}>Limpar filtros</Text>
      </SafeTouchable>
    </View>
  );
}

FilterEmptyState.propTypes = {
  onClear: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 10, gap: 10 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 12,
    backgroundColor: palette.surface,
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    fontSize: 15,
    color: palette.text,
  },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyText: { fontSize: 15, color: palette.textMuted, textAlign: 'center' },
  clearButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: palette.primarySoft,
  },
  clearText: { color: palette.primary, fontWeight: 'bold' },
});
