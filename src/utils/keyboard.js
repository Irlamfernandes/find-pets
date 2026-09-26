import { Keyboard } from 'react-native';

// Envolve a ação de um botão para fechar o teclado antes de executá-la
export function dismissKeyboardAnd(action) {
  return (...args) => {
    Keyboard.dismiss();
    return action?.(...args);
  };
}
