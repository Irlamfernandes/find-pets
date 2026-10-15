describe('apiConfig', () => {
  const original = process.env.EXPO_PUBLIC_API_URL;

  afterEach(() => {
    process.env.EXPO_PUBLIC_API_URL = original;
  });

  const loadUrl = () => {
    let url;
    jest.isolateModules(() => {
      url = require('../apiConfig').API_URL;
    });
    return url;
  };

  it('deve ler o endereço da variável de ambiente, sem barra no fim', () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://192.168.0.10:5001//';

    expect(loadUrl()).toBe('http://192.168.0.10:5001');
  });

  it('deve ficar vazio quando a variável não existir', () => {
    delete process.env.EXPO_PUBLIC_API_URL;

    expect(loadUrl()).toBe('');
  });
});
