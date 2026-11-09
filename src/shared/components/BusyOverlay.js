import React, { createContext, useCallback, useContext, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';
import PropTypes from 'prop-types';
import { palette } from '../theme/colors';

const BusyContext = createContext(null);

const passThrough = (promise) => promise;

export function BusyProvider({ children }) {
  const [pending, setPending] = useState(0);

  const track = useCallback((promise) => {
    setPending((count) => count + 1);
    return Promise.resolve(promise).finally(() => {
      setPending((count) => count - 1);
    });
  }, []);

  return (
    <BusyContext.Provider value={track}>
      {children}
      <Modal
        transparent
        statusBarTranslucent
        visible={pending > 0}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View testID="busy-overlay" style={styles.overlay}>
          <View style={styles.box}>
            <ActivityIndicator size="large" color={palette.primary} />
          </View>
        </View>
      </Modal>
    </BusyContext.Provider>
  );
}

BusyProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useBusy() {
  return useContext(BusyContext) || passThrough;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
  },
  box: {
    padding: 22,
    borderRadius: 18,
    backgroundColor: palette.surface,
  },
});
