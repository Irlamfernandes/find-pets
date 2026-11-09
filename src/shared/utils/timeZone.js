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

export function getTimeZoneInfo(date = new Date()) {
  const offsetMinutes = -date.getTimezoneOffset();
  let abbreviation = null;
  for (const locale of ABBREVIATION_LOCALES) {
    abbreviation = abbreviation || getAbbreviation(date, locale);
  }
  return { offsetMinutes, abbreviation };
}

export function formatUtcOffset(offsetMinutes) {
  if (offsetMinutes === 0) return 'UTC';
  const sign = offsetMinutes > 0 ? '+' : '-';
  const hours = Math.floor(Math.abs(offsetMinutes) / 60);
  const minutes = Math.abs(offsetMinutes) % 60;
  const suffix = minutes ? `:${String(minutes).padStart(2, '0')}` : '';
  return `UTC${sign}${hours}${suffix}`;
}

export function formatTimeZone({ offsetMinutes, abbreviation }) {
  const utc = formatUtcOffset(offsetMinutes);
  return abbreviation && abbreviation !== utc ? `${abbreviation}, ${utc}` : utc;
}

function isValidZone(zone) {
  return Number.isFinite(zone?.offsetMinutes);
}

const pad = (value) => String(value).padStart(2, '0');

export function formatDateTime(value, zone) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const info = isValidZone(zone) ? zone : getTimeZoneInfo(date);
  const local = new Date(date.getTime() + info.offsetMinutes * 60000);
  const day = `${pad(local.getUTCDate())}/${pad(local.getUTCMonth() + 1)}/${local.getUTCFullYear()}`;
  const time = `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`;
  return `${day} às ${time} (${formatTimeZone(info)})`;
}
