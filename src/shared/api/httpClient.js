import { API_URL } from './apiConfig';

const TIMEOUT_MS = 15000;

// A API respondeu com erro (ex.: 401 senha errada, 409 e-mail repetido)
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

// Não foi possível falar com a API (sem internet ou servidor fora do ar).
// O app continua funcionando offline e tenta de novo depois.
export class OfflineError extends Error {
  constructor(message = 'Sem conexão com o servidor.') {
    super(message);
    this.name = 'OfflineError';
  }
}

export const isUnauthorized = (error) =>
  error instanceof HttpError && error.status === 401;

function buildRequest({ method = 'GET', body, token, form }) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  if (form) return { method, headers, body: form };
  if (body === undefined) return { method, headers };
  return {
    method,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

async function send(path, options) {
  if (!API_URL) throw new OfflineError('Servidor não configurado.');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${API_URL}${path}`, {
      ...buildRequest(options),
      signal: controller.signal,
    });
  } catch {
    throw new OfflineError();
  } finally {
    clearTimeout(timer);
  }
}

async function readBody(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

// Faz a requisição e devolve o JSON da resposta (ou null, sem corpo).
// options: { method, body (JSON), form (FormData), token }
export async function request(path, options = {}) {
  const response = await send(path, options);
  const data = await readBody(response);
  if (!response.ok) {
    throw new HttpError(
      response.status,
      data?.error || 'Erro ao falar com o servidor.'
    );
  }
  return data;
}
