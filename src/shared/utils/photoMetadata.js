import { getTimeZoneInfo } from './timeZone';

function toNumber(value) {
  const number = typeof value === 'string' ? Number.parseFloat(value) : value;
  return Number.isFinite(number) ? number : null;
}

function applyRef(value, ref, negativeRef) {
  if (value === null) return null;
  return ref === negativeRef ? -Math.abs(value) : value;
}

const readGpsTag = (exif, tag) => exif[`GPS${tag}`] ?? exif['{GPS}']?.[tag];

const readCoordinate = (exif, tag, negativeRef) =>
  applyRef(
    toNumber(readGpsTag(exif, tag)),
    readGpsTag(exif, `${tag}Ref`),
    negativeRef
  );

const isInRange = (value, limit) => value !== null && Math.abs(value) <= limit;

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
const MIN_PHOTO_YEAR = 1990;
const MAX_CLOCK_AHEAD_MS = 24 * 60 * 60 * 1000;

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

export function getPhotoDate(exif) {
  const iso = toIsoDateTime(readExif(exif, 'DateTimeOriginal'));
  if (!iso) return null;

  const date = toPhotoDate(iso, getPhotoOffsetMinutes(exif));
  return isPlausiblePhotoDate(date) ? date : null;
}

export function getPhotoTimeZone(exif, date) {
  const deviceZone = getTimeZoneInfo(date);
  const offset = getPhotoOffsetMinutes(exif);
  if (offset === null || offset === deviceZone.offsetMinutes) return deviceZone;
  return { offsetMinutes: offset, abbreviation: null };
}

function findPhotoCoords(photos) {
  for (const photo of photos) {
    const coords = getPhotoCoords(photo.exif) || photo.coords;
    if (coords) return coords;
  }
  return null;
}

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
