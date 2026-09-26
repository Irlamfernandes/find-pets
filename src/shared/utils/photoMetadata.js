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

// Android usa a tag na raiz (GPSLatitude); iOS, dentro de "{GPS}" (Latitude)
const readGpsTag = (exif, tag) => exif[`GPS${tag}`] ?? exif['{GPS}']?.[tag];

const readCoordinate = (exif, tag, negativeRef) =>
  applyRef(
    toNumber(readGpsTag(exif, tag)),
    readGpsTag(exif, `${tag}Ref`),
    negativeRef
  );

const isInRange = (value, limit) => value !== null && Math.abs(value) <= limit;

// Latitude entre -90 e 90, longitude entre -180 e 180. Algumas câmeras
// gravam 0,0 quando não há sinal de GPS.
const isValidCoords = (latitude, longitude) =>
  isInRange(latitude, 90) &&
  isInRange(longitude, 180) &&
  (latitude !== 0 || longitude !== 0);

export function getPhotoCoords(exif) {
  if (!exif) return null;
  const latitude = readCoordinate(exif, 'Latitude', 'S');
  const longitude = readCoordinate(exif, 'Longitude', 'W');
  return isValidCoords(latitude, longitude) ? { latitude, longitude } : null;
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

const EXIF_DATE = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/;
// Câmeras sem relógio acertado gravam datas como 0000:00:00 ou 1970
const MIN_PHOTO_YEAR = 1990;
// Tolera pequenas diferenças de relógio entre a câmera e o celular
const MAX_CLOCK_AHEAD_MS = 24 * 60 * 60 * 1000;

// "2026:09:25 14:30:00" -> "2026-09-25T14:30:00", só se a data existir
// (31/02 ou 25:00 viram null: a data refeita precisa ser igual à lida)
function toIsoDateTime(raw) {
  const match = EXIF_DATE.exec(typeof raw === 'string' ? raw : '');
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;
  const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  const asUtc = new Date(`${iso}Z`);
  const exists =
    !Number.isNaN(asUtc.getTime()) && asUtc.toISOString().startsWith(iso);
  return exists ? iso : null;
}

// Sem fuso gravado na foto, considera o fuso do aparelho
function toPhotoDate(iso, offsetMinutes) {
  if (offsetMinutes === null) {
    const [year, month, day, hour, minute, second] = iso
      .split(/\D/)
      .map(Number);
    return new Date(year, month - 1, day, hour, minute, second);
  }
  return new Date(new Date(`${iso}Z`).getTime() - offsetMinutes * 60000);
}

const isPlausiblePhotoDate = (date) =>
  date.getFullYear() >= MIN_PHOTO_YEAR &&
  date.getTime() <= Date.now() + MAX_CLOCK_AHEAD_MS;

// Data e hora em que a foto foi tirada, ou null se ausente ou impossível
export function getPhotoDate(exif) {
  const iso = toIsoDateTime(readExif(exif, 'DateTimeOriginal'));
  if (!iso) return null;

  const date = toPhotoDate(iso, getPhotoOffsetMinutes(exif));
  return isPlausiblePhotoDate(date) ? date : null;
}

// Fuso de quando a foto foi tirada. A sigla só é conhecida quando o fuso da
// foto é o mesmo do aparelho naquela data.
export function getPhotoTimeZone(exif, date) {
  const deviceZone = getTimeZoneInfo(date);
  const offset = getPhotoOffsetMinutes(exif);
  if (offset === null || offset === deviceZone.offsetMinutes) return deviceZone;
  return { offsetMinutes: offset, abbreviation: null };
}

// Primeiro local encontrado: GPS da foto ou local registrado pelo app ao
// fotografar
function findPhotoCoords(photos) {
  for (const photo of photos) {
    const coords = getPhotoCoords(photo.exif) || photo.coords;
    if (coords) return coords;
  }
  return null;
}

// Foto mais antiga entre as que têm data: { photo, date } ou null
function findEarliestPhoto(photos) {
  return photos
    .map((photo) => ({ photo, date: getPhotoDate(photo.exif) }))
    .filter((item) => item.date)
    .reduce(
      (earliest, item) =>
        !earliest || item.date < earliest.date ? item : earliest,
      null
    );
}

// Local da primeira foto que tiver GPS e data (com o fuso) da mais antiga
export function getPhotosMetadata(photos) {
  const earliest = findEarliestPhoto(photos);
  return {
    coords: findPhotoCoords(photos),
    occurredAt: earliest ? earliest.date : null,
    occurredZone: earliest
      ? getPhotoTimeZone(earliest.photo.exif, earliest.date)
      : null,
  };
}
