import { isRemoteUri, uploadPhoto } from '../uploadsApi';
import { request } from '../httpClient';

jest.mock('../httpClient', () => ({ request: jest.fn() }));

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

  it('deve enviar a foto do celular e devolver o endereço', async () => {
    const url = await uploadPhoto('token', 'file:///docs/a.png');

    expect(url).toBe('http://api/uploads/1.jpg');
    const [path, options] = request.mock.calls[0];
    expect(path).toBe('/uploads');
    expect(options).toMatchObject({ method: 'POST', token: 'token' });
    expect(options.form.parts).toEqual([
      [
        'file',
        { uri: 'file:///docs/a.png', name: 'foto.png', type: 'image/png' },
      ],
    ]);
  });

  it('deve enviar como JPEG fotos de outros formatos', async () => {
    await uploadPhoto('token', 'file:///cache/foto');

    const [, file] = request.mock.calls[0][1].form.parts[0];
    expect(file).toMatchObject({ name: 'foto.jpg', type: 'image/jpeg' });
  });
});
