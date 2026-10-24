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

// expo-image nos testes: um componente simples com as mesmas props
jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');

  const Image = (props) => React.createElement(View, props);
  Image.displayName = 'Image';

  return { Image };
});

// Armazenamentos nativos não existem no Jest: todos os testes usam versões em
// memória (cada arquivo de teste pode substituí-las com o próprio jest.mock).
jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: require('./src/testing/memoryStorage').createAsyncStorageMock(),
}));
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

// Estado da conexão (expo-network): online por padrão
jest.mock('expo-network', () =>
  require('./src/testing/networkMock').createNetworkMock()
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

// Mapa nativo (react-native-maps): nos testes, o mapa e os marcadores viram
// componentes simples que expõem as mesmas props
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');

  const MapView = (props) => React.createElement(View, props);
  MapView.displayName = 'MapView';
  const Marker = (props) => React.createElement(View, props);
  Marker.displayName = 'Marker';

  return { __esModule: true, default: MapView, Marker };
});
