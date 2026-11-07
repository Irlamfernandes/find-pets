const MIN_DELTA = 0.01;
const PADDING_FACTOR = 1.4;

export const regionAround = ({ latitude, longitude }, delta = MIN_DELTA) => ({
  latitude,
  longitude,
  latitudeDelta: delta,
  longitudeDelta: delta,
});

function rangeOf(values) {
  return { min: Math.min(...values), max: Math.max(...values) };
}

const deltaOf = ({ min, max }) =>
  Math.max((max - min) * PADDING_FACTOR, MIN_DELTA);

export function regionForPoints(points) {
  const latitudes = rangeOf(points.map((point) => point.latitude));
  const longitudes = rangeOf(points.map((point) => point.longitude));
  return {
    latitude: (latitudes.min + latitudes.max) / 2,
    longitude: (longitudes.min + longitudes.max) / 2,
    latitudeDelta: deltaOf(latitudes),
    longitudeDelta: deltaOf(longitudes),
  };
}
