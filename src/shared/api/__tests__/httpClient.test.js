import {
  request,
  HttpError,
  OfflineError,
  isUnauthorized,
} from '../httpClient';

let mockApiUrl = 'http://api.test';
jest.mock('../apiConfig', () => ({
  get API_URL() {
    return mockApiUrl;
  },
}));

const response = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => body,
});

describe('httpClient', () => {
  beforeEach(() => {
    mockApiUrl = 'http://api.test';
    global.fetch = jest.fn();
  });

  it('deve enviar JSON com o token e devolver a resposta', async () => {
    fetch.mockResolvedValueOnce(response(201, '{"id":"1"}'));

    const data = await request('/posts/1', {
      method: 'PUT',
      body: { petName: 'Rex' },
      token: 'abc',
    });

    expect(data).toEqual({ id: '1' });
    expect(fetch).toHaveBeenCalledWith('http://api.test/posts/1', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer abc',
        'Content-Type': 'application/json',
      },
      body: '{"petName":"Rex"}',
      signal: expect.any(Object),
    });
  });

  it('deve fazer GET sem corpo e aceitar resposta vazia', async () => {
    fetch.mockResolvedValueOnce(response(204, ''));

    await expect(request('/health')).resolves.toBeNull();
    expect(fetch).toHaveBeenCalledWith('http://api.test/health', {
      method: 'GET',
      headers: {},
      signal: expect.any(Object),
    });
  });

  it('deve enviar formulários (fotos) sem definir o Content-Type', async () => {
    const form = { append: jest.fn() };
    fetch.mockResolvedValueOnce(response(201, '{"url":"u"}'));

    await request('/uploads', { method: 'POST', form, token: 't' });

    expect(fetch.mock.calls[0][1]).toEqual({
      method: 'POST',
      headers: { Authorization: 'Bearer t' },
      body: form,
      signal: expect.any(Object),
    });
  });

  it('deve transformar respostas de erro em HttpError', async () => {
    fetch.mockResolvedValueOnce(response(401, '{"error":"Token inválido."}'));
    const unauthorized = await request('/profile').catch((error) => error);

    expect(unauthorized).toBeInstanceOf(HttpError);
    expect(unauthorized.status).toBe(401);
    expect(unauthorized.message).toBe('Token inválido.');
    expect(isUnauthorized(unauthorized)).toBe(true);

    fetch.mockResolvedValueOnce(response(502, '<html>Bad gateway</html>'));
    await expect(request('/profile')).rejects.toThrow(
      'Erro ao falar com o servidor.'
    );
    expect(isUnauthorized(new Error('x'))).toBe(false);
  });

  it('deve indicar falta de conexão quando a API não responde', async () => {
    fetch.mockRejectedValueOnce(new TypeError('Network request failed'));

    const error = await request('/health').catch((caught) => caught);

    expect(error).toBeInstanceOf(OfflineError);
    expect(error.message).toBe('Sem conexão com o servidor.');
  });

  it('deve desistir da requisição que demora demais', async () => {
    jest.useFakeTimers();
    fetch.mockImplementationOnce(
      (url, { signal }) =>
        new Promise((resolve, reject) => {
          signal.addEventListener('abort', () => reject(new Error('abort')));
        })
    );

    const pending = request('/posts');
    jest.advanceTimersByTime(15000);

    await expect(pending).rejects.toBeInstanceOf(OfflineError);
    jest.useRealTimers();
  });

  it('deve tratar a API não configurada como sem conexão', async () => {
    mockApiUrl = '';

    await expect(request('/health')).rejects.toThrow(
      'Servidor não configurado.'
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});
