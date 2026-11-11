import { normalizeText } from '../text';

describe('normalizeText', () => {
  it('deve comparar sem acentos, maiúsculas nem espaços nas pontas', () => {
    expect(normalizeText('  Pastor Alemão ')).toBe('pastor alemao');
  });

  it('deve tratar valores vazios como texto vazio', () => {
    expect(normalizeText(undefined)).toBe('');
    expect(normalizeText(null)).toBe('');
  });
});
