export const PHONE_MAX_DIGITS = 13;
export const PHONE_MIN_DIGITS = 12;

export function onlyDigits(value) {
  return (value || '').replaceAll(/\D/g, '').slice(0, PHONE_MAX_DIGITS);
}

export function formatPhone(value) {
  const digits = onlyDigits(value);
  if (!digits) return '';

  const country = digits.slice(0, 2);
  const ddd = digits.slice(2, 4);
  const number = digits.slice(4);

  let formatted = `+${country}`;
  if (ddd) formatted += ` (${ddd}`;
  if (number) {
    const splitAt = digits.length === PHONE_MIN_DIGITS ? 4 : 5;
    const prefix = number.slice(0, splitAt);
    const suffix = number.slice(splitAt);
    formatted += `) ${prefix}`;
    if (suffix) formatted += `-${suffix}`;
  }
  return formatted;
}
