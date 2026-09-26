import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

export function useKeyboardVisible() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', () =>
      setIsVisible(true)
    );
    const hideListener = Keyboard.addListener('keyboardDidHide', () =>
      setIsVisible(false)
    );

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  return isVisible;
}
