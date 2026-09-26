import React, { useState } from 'react';
import {
  Modal,
  View,
  Image,
  FlatList,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SafeTouchable } from './SafeTouchable';
import { palette } from '../theme/colors';

export function PhotoViewerModal({ images, initialIndex = 0, onClose }) {
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const visible = images.length > 0;

  const handleScrollEnd = (event) => {
    setCurrentIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      onShow={() => setCurrentIndex(initialIndex)}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.counter}>
            {visible ? `${currentIndex + 1} de ${images.length}` : ''}
          </Text>
          <SafeTouchable
            testID="button-close-photo-viewer"
            accessibilityLabel="Fechar fotos"
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={28} color={palette.white} />
          </SafeTouchable>
        </View>

        <FlatList
          data={images}
          keyExtractor={(uri, index) => `${uri}-${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          onMomentumScrollEnd={handleScrollEnd}
          renderItem={({ item }) => (
            <Image
              testID="photo-viewer-image"
              source={{ uri: item }}
              style={[styles.image, { width }]}
              resizeMode="contain"
            />
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

PhotoViewerModal.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string).isRequired,
  initialIndex: PropTypes.number,
  onClose: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  counter: { color: palette.white, fontSize: 16, fontWeight: 'bold' },
  closeButton: { padding: 4 },
  image: { height: '100%' },
});
