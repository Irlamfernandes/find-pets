export const rule = (test, error) => ({ test, error });

export function validate(values, rules) {
  const failed = rules.find(({ test }) => !test(values));
  return failed ? failed.error : null;
}

export const isFilled = (value) => Boolean(value?.trim());

const WHITESPACE = /\s/;

export function isValidEmail(email = '') {
  const parts = email.split('@');
  if (WHITESPACE.test(email) || parts.length !== 2) return false;

  const [name, domain] = parts;
  const dot = domain.indexOf('.', 1);
  return name.length > 0 && dot !== -1 && domain.length - dot - 1 >= 2;
}

export const normalizeEmail = (email) => (email || '').trim().toLowerCase();
