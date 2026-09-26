import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';
import { SafeTouchable } from '../../../shared/components/SafeTouchable';
import { SharePoster } from './SharePoster';
import { palette } from '../../../shared/theme/colors';

// Mostra o cartaz antes de enviar; o botão só libera depois que a foto
// carregou, para a imagem compartilhada não sair sem ela
export function SharePreviewModal({ post, onShare, onClose }) {
  const posterRef = useRef(null);
  const [isImageReady, setIsImageReady] = useState(false);

  const handleClose = () => {
    setIsImageReady(false);
    onClose();
  };

  return (
    <Modal
      visible={!!post}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Compartilhar cartaz</Text>
          <Text style={styles.subtitle}>
            Foto e informações vão juntas em uma única imagem.
          </Text>

          <ScrollView contentContainerStyle={styles.previewContent}>
            {post ? (
              <SharePoster
                post={post}
                viewRef={posterRef}
                onImageLoadEnd={() => setIsImageReady(true)}
              />
            ) : null}
          </ScrollView>

          <View style={styles.actions}>
            <SafeTouchable
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </SafeTouchable>
            <SafeTouchable
              testID="button-share-poster"
              style={[styles.button, styles.shareButton]}
              disabled={!isImageReady}
              onPress={() => onShare(posterRef.current)}
            >
              {isImageReady ? (
                <Text style={styles.shareText}>Compartilhar</Text>
              ) : (
                <ActivityIndicator color={palette.white} />
              )}
            </SafeTouchable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

SharePreviewModal.propTypes = {
  post: PropTypes.object,
  onShare: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: palette.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: palette.text },
  subtitle: { fontSize: 13, color: palette.textMuted, marginTop: 2 },
  previewContent: { paddingVertical: 14 },
  actions: { flexDirection: 'row', gap: 10 },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  shareButton: { backgroundColor: palette.primary },
  cancelText: { color: palette.text, fontWeight: 'bold' },
  shareText: { color: palette.white, fontWeight: 'bold' },
});
