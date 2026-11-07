import { useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';

export function useBackHandler(onBack) {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onBackRef.current();
        return true;
      }
    );
    return () => subscription.remove();
  }, []);
}
