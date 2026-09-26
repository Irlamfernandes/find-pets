// Os ícones reais carregam a fonte de forma assíncrona e atualizam o estado
// depois do teste, gerando avisos de act(...) e deixando a suíte mais lenta.
// Nos testes, eles viram um componente simples que expõe as mesmas props.
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');

  const Ionicons = (props) => React.createElement(View, props);
  Ionicons.displayName = 'Ionicons';

  return { Ionicons };
});
