jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');

  const Ionicons = (props) => React.createElement(View, props);
  Ionicons.displayName = 'Ionicons';

  return { Ionicons };
});

jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');

  const Image = (props) => React.createElement(View, props);
  Image.displayName = 'Image';

  return { Image };
});

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

jest.mock('expo-crypto', () => ({
  randomUUID: () => require('node:crypto').randomUUID(),
}));

jest.mock('expo-network', () =>
  require('./src/testing/networkMock').createNetworkMock()
);

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

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');

  const MapView = (props) => React.createElement(View, props);
  MapView.displayName = 'MapView';
  const Marker = (props) => React.createElement(View, props);
  Marker.displayName = 'Marker';

  return { __esModule: true, default: MapView, Marker };
});
