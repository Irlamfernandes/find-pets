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

// Armazenamentos nativos não existem no Jest: todos os testes usam versões em
// memória (cada arquivo de teste pode substituí-las com o próprio jest.mock).
jest.mock('@react-native-async-storage/async-storage', () =>
  require('./src/testing/memoryStorage').createAsyncStorageMock()
);
jest.mock('expo-secure-store', () =>
  require('./src/testing/memoryStorage').createSecureStoreMock()
);
