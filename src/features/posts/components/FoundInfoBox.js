import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { formatDateTime } from '../../../shared/utils/timeZone';
import { palette } from '../../../shared/theme/colors';

const describeReceiver = ({ receiverName, receiverRelation }) =>
  receiverRelation ? `${receiverName} (${receiverRelation})` : receiverName;

const describeFoundAt = ({ foundAt, foundZone }) =>
  formatDateTime(foundAt, foundZone) || 'data não informada';

// Linhas do quadro; as opcionais só aparecem quando preenchidas
function getFoundLines(foundInfo) {
  return [
    foundInfo.receiverName && `Com: ${describeReceiver(foundInfo)}`,
    `Em: ${describeFoundAt(foundInfo)}`,
    foundInfo.foundLocation && `Onde: ${foundInfo.foundLocation}`,
    foundInfo.notes,
  ].filter(Boolean);
}

// Quadro "Reencontro registrado" dos pets encontrados
export function FoundInfoBox({ foundInfo }) {
  return (
    <View testID="found-info" style={styles.box}>
      <View style={styles.header}>
        <Ionicons name="heart" size={16} color={palette.success} />
        <Text style={styles.title}>Reencontro registrado</Text>
      </View>
      {getFoundLines(foundInfo).map((line) => (
        <Text key={line} style={styles.text}>
          {line}
        </Text>
      ))}
    </View>
  );
}

FoundInfoBox.propTypes = {
  foundInfo: PropTypes.shape({
    receiverName: PropTypes.string,
    receiverRelation: PropTypes.string,
    foundAt: PropTypes.string,
    foundZone: PropTypes.shape({
      offsetMinutes: PropTypes.number,
      abbreviation: PropTypes.string,
    }),
    foundLocation: PropTypes.string,
    notes: PropTypes.string,
  }).isRequired,
};

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    gap: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  title: { fontWeight: 'bold', color: palette.text },
  text: { fontSize: 13, color: palette.text },
});
