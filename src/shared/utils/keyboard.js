import { Keyboard } from 'react-native';

export function dismissKeyboardAnd(action) {
  return (...args) => {
    Keyboard.dismiss();
    return action?.(...args);
  };
}
