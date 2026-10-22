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
jest.mock('expo-sqlite', () =>
  require('./src/testing/sqliteMock').createSQLiteMock()
);

// O UUID do expo-crypto é gerado pelo código nativo; nos testes, pelo Node
jest.mock('expo-crypto', () => ({
  randomUUID: () => require('node:crypto').randomUUID(),
}));

// Estado da conexão: o pacote traz um mock oficial (online por padrão)
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js')
);

// Firebase em memória: contas, login e Realtime Database
jest.mock(
  'firebase/app',
  () => require('./src/testing/firebaseMock').appModule
);
jest.mock(
  'firebase/auth',
  () => require('./src/testing/firebaseMock').authModule
);
jest.mock(
  'firebase/database',
  () => require('./src/testing/firebaseMock').databaseModule
);

// Redução das fotos é nativa: nos testes, o "base64" mostra a foto de origem
jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  ImageManipulator: {
    manipulate: (uri) => ({
      resize: jest.fn(),
      renderAsync: async () => ({
        saveAsync: async () => ({ base64: `foto(${uri})` }),
      }),
    }),
  },
}));
