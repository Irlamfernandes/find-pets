import React from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { ActionButton } from '../../../shared/components/ActionButton';
import { hasCoordinates } from '../domain/post';

// WhatsApp de quem registrou e rota até o local (quando há coordenadas)
export function ContactButtons({ post, onOpenWhatsApp, onOpenRoute }) {
  return (
    <View style={styles.row}>
      <ActionButton
        icon="logo-whatsapp"
        label="WhatsApp"
        variant="success"
        onPress={() => onOpenWhatsApp(post.contactPhone)}
      />
      {hasCoordinates(post) ? (
        <ActionButton
          icon="navigate-outline"
          label="Como chegar"
          accessibilityLabel="Traçar rota até o local no app de mapas"
          onPress={onOpenRoute}
        />
      ) : null}
    </View>
  );
}

ContactButtons.propTypes = {
  post: PropTypes.object.isRequired,
  onOpenWhatsApp: PropTypes.func.isRequired,
  onOpenRoute: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
});
