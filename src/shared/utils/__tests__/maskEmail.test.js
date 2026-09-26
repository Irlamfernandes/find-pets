import { maskEmail } from '../maskEmail';

describe('maskEmail', () => {
  it('deve esconder parte do nome do e-mail', () => {
    expect(maskEmail('irlam@gmail.com')).toBe('ir***@gmail.com');
    expect(maskEmail('a@b.com')).toBe('a***@b.com');
  });

  it('deve retornar apenas asteriscos para valores inválidos', () => {
    expect(maskEmail('')).toBe('***');
    expect(maskEmail(null)).toBe('***');
    expect(maskEmail('semarroba')).toBe('***');
  });
});
