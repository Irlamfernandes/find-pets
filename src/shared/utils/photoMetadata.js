import { getTimeZoneInfo } from './timeZone';

// Extrai localização e data/hora dos metadados EXIF das fotos.
// Android expõe as tags na raiz (GPSLatitude); iOS agrupa em "{GPS}" e "{Exif}".

function toNumber(value) {
  const number = typeof value === 'string' ? Number.parseFloat(value) : value;
  return Number.isFinite(number) ? number : null;
}

function applyRef(value, ref, negativeRef) {
  if (value === null) return null;
  return ref === negativeRef ? -Math.abs(value) : value;
}

export function getPhotoCoords(exif) {
  if (!exif) return null;

  const gps = exif['{GPS}'] || {};
  const latitude = applyRef(
    toNumber(exif.GPSLatitude ?? gps.Latitude),
    exif.GPSLatitudeRef ?? gps.LatitudeRef,
    'S'
  );
  const longitude = applyRef(
    toNumber(exif.GPSLongitude ?? gps.Longitude),
    exif.GPSLongitudeRef ?? gps.LongitudeRef,
    'W'
  );

  if (latitude === null || longitude === null) return null;
  // Algumas câmeras gravam 0,0 quando não há sinal de GPS
  if (latitude === 0 && longitude === 0) return null;
  return { latitude, longitude };
}

function readExif(exif, tag) {
  return exif?.[tag] ?? exif?.['{Exif}']?.[tag];
}

// Deslocamento do fuso gravado pela câmera. Formato EXIF: "-03:00"
function getPhotoOffsetMinutes(exif) {
  const raw = readExif(exif, 'OffsetTimeOriginal');
  const match = /^([+-])(\d{2}):(\d{2})$/.exec(
    typeof raw === 'string' ? raw : ''
  );
  if (!match) return null;
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === '-' ? -minutes : minutes;
}

// Formato EXIF: "2026:09:25 14:30:00". Sem fuso gravado na foto, considera o
// fuso do aparelho.
export function getPhotoDate(exif) {
  const raw = readExif(exif, 'DateTimeOriginal');
  if (typeof raw !== 'string') return null;

  const match = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(raw);
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match.map(Number);
  const offset = getPhotoOffsetMinutes(exif);
  if (offset === null) {
    return new Date(year, month - 1, day, hour, minute, second);
  }
  const utc = Date.UTC(year, month - 1, day, hour, minute, second);
  return new Date(utc - offset * 60000);
}

// Fuso de quando a foto foi tirada. A sigla só é conhecida quando o fuso da
// foto é o mesmo do aparelho naquela data.
export function getPhotoTimeZone(exif, date) {
  const deviceZone = getTimeZoneInfo(date);
  const offset = getPhotoOffsetMinutes(exif);
  if (offset === null || offset === deviceZone.offsetMinutes) return deviceZone;
  return { offsetMinutes: offset, abbreviation: null };
}

// Usa a primeira foto que tiver GPS (dos metadados ou registrado pelo app ao
// fotografar) e a data mais antiga entre as fotos, com o fuso dela
export function getPhotosMetadata(photos) {
  let coords = null;
  let occurredAt = null;
  let occurredZone = null;

  for (const photo of photos) {
    coords = coords || getPhotoCoords(photo.exif) || photo.coords || null;
    const date = getPhotoDate(photo.exif);
    if (date && (!occurredAt || date < occurredAt)) {
      occurredAt = date;
      occurredZone = getPhotoTimeZone(photo.exif, date);
    }
  }

  return { coords, occurredAt, occurredZone };
}
