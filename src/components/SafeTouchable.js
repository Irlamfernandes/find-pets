import React, { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

// Botão que evita cliques repetidos: se a ação devolver uma Promise
// (salvar, entrar, registrar...), o botão fica travado até ela terminar.
// A trava usa uma ref para bloquear até toques duplos no mesmo instante.
export function SafeTouchable({ onPress, disabled, style, ...props }) {
  const lockedRef = useRef(false);
  const mountedRef = useRef(true);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    []
  );

  const handlePress = async (event) => {
    if (lockedRef.current || !onPress) return;

    const result = onPress(event);
    if (!result || typeof result.then !== 'function') return;

    lockedRef.current = true;
    setIsBusy(true);
    try {
      await result;
    } finally {
      lockedRef.current = false;
      if (mountedRef.current) setIsBusy(false);
    }
  };

  return (
    <TouchableOpacity
      {...props}
      style={[style, isBusy && styles.busy]}
      disabled={disabled || isBusy}
      onPress={handlePress}
    />
  );
}

SafeTouchable.propTypes = {
  onPress: PropTypes.func,
  disabled: PropTypes.bool,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

const styles = StyleSheet.create({
  busy: { opacity: 0.6 },
});
