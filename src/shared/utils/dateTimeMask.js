// Máscaras e validação de data (dd/mm/aaaa) e hora (HH:MM) digitadas pelo usuário

export function formatDateInput(value) {
  const digits = (value || '').replace(/\D/g, '').slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)];
  return parts.filter(Boolean).join('/');
}

export function formatTimeInput(value) {
  const digits = (value || '').replace(/\D/g, '').slice(0, 4);
  return digits.length > 2
    ? `${digits.slice(0, 2)}:${digits.slice(2)}`
    : digits;
}

export function toDateInput(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

export function toTimeInput(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Retorna a data correspondente ou null se for inválida (ex.: 31/02, 25:00).
// O Date "corrige" valores fora do intervalo (31/02 vira 03/03), então a data
// só é válida se, formatada de volta, for igual ao que foi digitado.
export function parseDateTimeInput(dateText, timeText) {
  const text = `${dateText} ${timeText}`;
  const match = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(text);
  if (!match) return null;

  const [, day, month, year, hours, minutes] = match.map(Number);
  const date = new Date(year, month - 1, day, hours, minutes);
  return `${toDateInput(date)} ${toTimeInput(date)}` === text ? date : null;
}
