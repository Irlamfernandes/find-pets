// Código do país (2) + DDD (2) + número (até 9)
export const PHONE_MAX_DIGITS = 13;
export const PHONE_MIN_DIGITS = 12;
const DEFAULT_COUNTRY_CODE = '55';

export function onlyDigits(value) {
  return (value || '').replace(/\D/g, '').slice(0, PHONE_MAX_DIGITS);
}

// Números antigos foram salvos sem o código do país (apenas DDD + número)
export function withCountryCode(value) {
  const digits = onlyDigits(value);
  if (digits.length === 10 || digits.length === 11) {
    return `${DEFAULT_COUNTRY_CODE}${digits}`;
  }
  return digits;
}

// Formata para exibição: +55 (11) 99999-9999
export function formatPhone(value) {
  const digits = onlyDigits(value);
  if (!digits) return '';

  const country = digits.slice(0, 2);
  const ddd = digits.slice(2, 4);
  const number = digits.slice(4);

  let formatted = `+${country}`;
  if (ddd) formatted += ` (${ddd}`;
  if (number) {
    // Fixo completo (8 dígitos) usa 4-4; celular usa 5-4
    const splitAt = digits.length === PHONE_MIN_DIGITS ? 4 : 5;
    const prefix = number.slice(0, splitAt);
    const suffix = number.slice(splitAt);
    formatted += `) ${prefix}`;
    if (suffix) formatted += `-${suffix}`;
  }
  return formatted;
}
