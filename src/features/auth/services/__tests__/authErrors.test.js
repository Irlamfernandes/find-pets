import { friendlyAuthError, isWrongCredentials } from '../authErrors';

const withCode = (code) => Object.assign(new Error(code), { code });

describe('authErrors', () => {
  it('deve reconhecer e-mail ou senha que não conferem', () => {
    expect(isWrongCredentials(withCode('auth/invalid-credential'))).toBe(true);
    expect(isWrongCredentials(withCode('auth/weak-password'))).toBe(false);
    expect(isWrongCredentials(null)).toBe(false);
  });

  it('deve trocar os códigos conhecidos por mensagens em português', () => {
    expect(friendlyAuthError(withCode('auth/weak-password')).message).toBe(
      'A senha precisa ter pelo menos 6 caracteres.'
    );

    const other = new Error('Falha interna.');
    expect(friendlyAuthError(other)).toBe(other);
  });
});
