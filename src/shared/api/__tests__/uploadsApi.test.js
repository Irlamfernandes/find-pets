import { isRemoteUri, uploadPhoto } from '../uploadsApi';
import { request } from '../httpClient';

jest.mock('../httpClient', () => ({ request: jest.fn() }));

jest.mock('expo-file-system', () => ({
  File: class {
    constructor(uri) {
      this.uri = uri;
    }
  },
}));

describe('uploadsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.FormData = class {
      constructor() {
        this.parts = [];
      }
      append(name, value) {
        this.parts.push([name, value]);
      }
    };
    request.mockResolvedValue({ url: 'http://api/uploads/1.jpg' });
  });

  it('deve reconhecer fotos que já estão no servidor', () => {
    expect(isRemoteUri('https://api/uploads/1.jpg')).toBe(true);
    expect(isRemoteUri('HTTP://api/1.png')).toBe(true);
    expect(isRemoteUri('file:///docs/post-photo-1.jpg')).toBe(false);
    expect(isRemoteUri(null)).toBe(false);
  });

  it('deve enviar o arquivo da foto do celular e devolver o endereço', async () => {
    const url = await uploadPhoto('token', 'file:///docs/post-photo-1.jpg');

    expect(url).toBe('http://api/uploads/1.jpg');
    const [path, options] = request.mock.calls[0];
    expect(path).toBe('/uploads');
    expect(options).toMatchObject({ method: 'POST', token: 'token' });
    const [[field, file]] = options.form.parts;
    expect(field).toBe('file');
    expect(file.uri).toBe('file:///docs/post-photo-1.jpg');
  });
});
