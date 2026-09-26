import React, { useState } from 'react';
import { View, Text, Image, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SafeTouchable } from '../../../shared/components/SafeTouchable';
import { palette } from '../../../shared/theme/colors';

// Fotos do pet deslizando para o lado, com contador "1/3"
export function PhotoCarousel({ images, onOpenPhoto }) {
  const [width, setWidth] = useState(0);
  const [current, setCurrent] = useState(0);

  const handleScrollEnd = (event) => {
    if (!width) return;
    setCurrent(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <View
      testID="pet-carousel"
      style={styles.carousel}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <FlatList
        data={images}
        keyExtractor={(uri, index) => `${uri}-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        renderItem={({ item: uri, index }) => (
          <SafeTouchable
            activeOpacity={0.9}
            accessibilityLabel={`Ver foto ${index + 1} em tela cheia`}
            onPress={() => onOpenPhoto(index)}
          >
            <Image
              testID="pet-image"
              source={{ uri }}
              style={[styles.image, { width }]}
            />
          </SafeTouchable>
        )}
      />
      {images.length > 1 ? (
        <View style={styles.counter}>
          <Ionicons name="images-outline" size={14} color={palette.white} />
          <Text style={styles.counterText}>
            {current + 1}/{images.length}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

PhotoCarousel.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string).isRequired,
  onOpenPhoto: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  carousel: { height: 250, backgroundColor: palette.neutral },
  image: { height: 250 },
  counter: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  counterText: { color: palette.white, fontSize: 12, fontWeight: 'bold' },
});
