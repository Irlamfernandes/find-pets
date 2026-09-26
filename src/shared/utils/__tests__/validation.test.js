import {
  rule,
  validate,
  isFilled,
  isValidEmail,
  normalizeEmail,
} from '../validation';

describe('validation', () => {
  const rules = [
    rule(({ name }) => isFilled(name), 'Informe o nome.'),
    rule(({ age }) => age >= 18, 'Precisa ser maior de idade.'),
  ];

  it('deve devolver o erro da primeira regra que falhar', () => {
    expect(validate({ name: ' ', age: 10 }, rules)).toBe('Informe o nome.');
    expect(validate({ name: 'Ana', age: 10 }, rules)).toBe(
      'Precisa ser maior de idade.'
    );
  });

  it('deve devolver null quando todas as regras passarem', () => {
    expect(validate({ name: 'Ana', age: 20 }, rules)).toBeNull();
    expect(validate({}, [])).toBeNull();
  });

  it('deve aceitar erros em qualquer formato', () => {
    const alert = { title: 'Atenção' };
    expect(validate({}, [rule(() => false, alert)])).toBe(alert);
  });

  it('isFilled deve ignorar espaços e valores vazios', () => {
    expect(isFilled('Ana')).toBe(true);
    expect(isFilled('   ')).toBe(false);
    expect(isFilled('')).toBe(false);
    expect(isFilled(undefined)).toBe(false);
  });

  it('isValidEmail deve aceitar apenas e-mails completos', () => {
    expect(isValidEmail('ana@x.com')).toBe(true);
    expect(isValidEmail('ana@x')).toBe(false);
    expect(isValidEmail('ana x@x.com')).toBe(false);
    expect(isValidEmail(null)).toBe(false);
  });

  it('normalizeEmail deve ignorar maiúsculas e espaços nas pontas', () => {
    expect(normalizeEmail(' Ana@X.COM ')).toBe('ana@x.com');
    expect(normalizeEmail(undefined)).toBe('');
  });
});
