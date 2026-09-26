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

// Formato EXIF: "2026:09:25 14:30:00"
export function getPhotoDate(exif) {
  const raw = exif?.DateTimeOriginal ?? exif?.['{Exif}']?.DateTimeOriginal;
  if (typeof raw !== 'string') return null;

  const match = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(raw);
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match.map(Number);
  return new Date(year, month - 1, day, hour, minute, second);
}

// Usa a primeira foto que tiver GPS e a data mais antiga entre as fotos
export function getPhotosMetadata(photos) {
  let coords = null;
  let occurredAt = null;

  for (const photo of photos) {
    coords = coords || getPhotoCoords(photo.exif);
    const date = getPhotoDate(photo.exif);
    if (date && (!occurredAt || date < occurredAt)) {
      occurredAt = date;
    }
  }

  return { coords, occurredAt };
}

export function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const day = date.toLocaleDateString('pt-BR');
  const time = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${day} às ${time}`;
}
