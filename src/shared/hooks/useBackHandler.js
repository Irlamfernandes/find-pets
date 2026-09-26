import { useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';

// Faz o botão/gesto "voltar" do Android executar a mesma ação da seta de
// voltar da tela, em vez de fechar o app. No iOS não há efeito.
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
