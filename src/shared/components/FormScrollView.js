import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Keyboard, ScrollView, TextInput, View } from 'react-native';
import PropTypes from 'prop-types';

// Implementação só com APIs do React Native (compatível com o Expo Go).
// Ao abrir o teclado, reserva espaço no fim do formulário e rola a tela para
// que o campo em foco fique visível acima do teclado.
const FormScrollContext = createContext(null);

// Tempo para o layout aplicar o espaço extra / o novo foco antes de medir
const SCROLL_DELAY_MS = 100;

export function FormScrollView({ children, bottomOffset = 24, ...props }) {
  const scrollRef = useRef(null);
  const scrollY = useRef(0);
  const keyboardTop = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scrollToFocusedInput = useCallback(() => {
    const input = TextInput.State.currentlyFocusedInput();
    if (!input || keyboardTop.current === null) return;

    input.measureInWindow((x, y, width, height) => {
      const overlap = y + height + bottomOffset - keyboardTop.current;
      if (overlap > 0) {
        scrollRef.current?.scrollTo({
          y: scrollY.current + overlap,
          animated: true,
        });
      }
    });
  }, [bottomOffset]);

  const scheduleScroll = useCallback(() => {
    setTimeout(scrollToFocusedInput, SCROLL_DELAY_MS);
  }, [scrollToFocusedInput]);

  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', (event) => {
      keyboardTop.current = event.endCoordinates.screenY;
      setKeyboardHeight(event.endCoordinates.height);
      scheduleScroll();
    });
    const hideListener = Keyboard.addListener('keyboardDidHide', () => {
      keyboardTop.current = null;
      setKeyboardHeight(0);
    });

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, [scheduleScroll]);

  return (
    <FormScrollContext.Provider value={scheduleScroll}>
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(event) => {
          scrollY.current = event.nativeEvent.contentOffset.y;
        }}
        {...props}
      >
        {children}
        <View testID="keyboard-spacer" style={{ height: keyboardHeight }} />
      </ScrollView>
    </FormScrollContext.Provider>
  );
}

FormScrollView.propTypes = {
  children: PropTypes.node,
  bottomOffset: PropTypes.number,
};

// TextInput que, ao receber foco com o teclado já aberto (ex.: botão
// "próximo"), pede ao FormScrollView para rolar até ele.
export function FormTextInput({ onFocus, ...props }) {
  const scheduleScroll = useContext(FormScrollContext);

  return (
    <TextInput
      {...props}
      onFocus={(event) => {
        onFocus?.(event);
        scheduleScroll?.();
      }}
    />
  );
}

FormTextInput.propTypes = {
  onFocus: PropTypes.func,
};
