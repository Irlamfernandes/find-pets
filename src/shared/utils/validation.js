// Validação declarativa: cada regra testa os valores do formulário e traz o
// erro exibido quando falha. `validate` devolve o erro da primeira regra que
// falhar, ou null quando tudo está certo.
export const rule = (test, error) => ({ test, error });

export function validate(values, rules) {
  const failed = rules.find(({ test }) => !test(values));
  return failed ? failed.error : null;
}

export const isFilled = (value) => Boolean(value?.trim());

const WHITESPACE = /\s/;

// nome@dominio.ext: sem espaços, um único "@", nome não vazio e domínio com
// um ponto que tenha ao menos 1 caractere antes e 2 depois. Feito sem uma
// expressão regular única, que teria desempenho ruim (backtracking) com
// textos longos.
export function isValidEmail(email) {
  const value = email || '';
  const parts = value.split('@');
  if (WHITESPACE.test(value) || parts.length !== 2) return false;

  const [name, domain] = parts;
  // Ponto mais à esquerda (depois do 1º caractere): deixa o máximo depois
  const dot = domain.indexOf('.', 1);
  return name.length > 0 && dot !== -1 && domain.length - dot - 1 >= 2;
}

// E-mails são comparados sem diferenciar maiúsculas nem espaços nas pontas
export const normalizeEmail = (email) => (email || '').trim().toLowerCase();
