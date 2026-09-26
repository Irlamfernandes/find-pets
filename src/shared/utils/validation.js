// Validação declarativa: cada regra testa os valores do formulário e traz o
// erro exibido quando falha. `validate` devolve o erro da primeira regra que
// falhar, ou null quando tudo está certo.
export const rule = (test, error) => ({ test, error });

export function validate(values, rules) {
  const failed = rules.find(({ test }) => !test(values));
  return failed ? failed.error : null;
}

export const isFilled = (value) => Boolean(value?.trim());

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isValidEmail = (email) => EMAIL_PATTERN.test(email || '');
