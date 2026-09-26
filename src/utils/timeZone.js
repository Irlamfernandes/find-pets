// Fuso horário das datas registradas. Cada data guarda o deslocamento em
// relação ao UTC e a sigla do fuso do momento em que aconteceu, para que a
// hora seja sempre exibida como no local do fato, em qualquer país.

// Siglas conhecidas (BRT, EDT...). "GMT+2" e similares viram "UTC+2".
const ABBREVIATION = /^[A-Z]{2,5}$/;
const ABBREVIATION_LOCALES = ['pt-BR', 'en-US'];

function getAbbreviation(date, locale) {
  try {
    const part = new Intl.DateTimeFormat(locale, { timeZoneName: 'short' })
      .formatToParts(date)
      .find((item) => item.type === 'timeZoneName');
    return part && ABBREVIATION.test(part.value) ? part.value : null;
  } catch {
    return null;
  }
}

// Fuso do aparelho na data informada (considera horário de verão)
export function getTimeZoneInfo(date = new Date()) {
  const offsetMinutes = -date.getTimezoneOffset();
  let abbreviation = null;
  for (const locale of ABBREVIATION_LOCALES) {
    abbreviation = abbreviation || getAbbreviation(date, locale);
  }
  return { offsetMinutes, abbreviation };
}

// Ex.: -180 -> "UTC-3", 330 -> "UTC+5:30", 0 -> "UTC"
export function formatUtcOffset(offsetMinutes) {
  if (offsetMinutes === 0) return 'UTC';
  const sign = offsetMinutes > 0 ? '+' : '-';
  const hours = Math.floor(Math.abs(offsetMinutes) / 60);
  const minutes = Math.abs(offsetMinutes) % 60;
  const suffix = minutes ? `:${String(minutes).padStart(2, '0')}` : '';
  return `UTC${sign}${hours}${suffix}`;
}

// Ex.: "BRT, UTC-3" ou só "UTC+2" quando não há sigla conhecida
export function formatTimeZone({ offsetMinutes, abbreviation }) {
  const utc = formatUtcOffset(offsetMinutes);
  return abbreviation && abbreviation !== utc ? `${abbreviation}, ${utc}` : utc;
}

function isValidZone(zone) {
  return Number.isFinite(zone?.offsetMinutes);
}

const pad = (value) => String(value).padStart(2, '0');

// Formata no fuso em que a data foi registrada: "25/09/2026 às 14:30 (BRT, UTC-3)".
// Registros antigos, sem fuso salvo, usam o fuso do aparelho.
export function formatDateTime(value, zone) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const info = isValidZone(zone) ? zone : getTimeZoneInfo(date);
  const local = new Date(date.getTime() + info.offsetMinutes * 60000);
  const day = `${pad(local.getUTCDate())}/${pad(local.getUTCMonth() + 1)}/${local.getUTCFullYear()}`;
  const time = `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`;
  return `${day} às ${time} (${formatTimeZone(info)})`;
}
