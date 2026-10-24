// Área do mapa (região) a mostrar, em graus de latitude e longitude

// Menor área exibida: cerca de 1 km em volta de um único ponto
const MIN_DELTA = 0.01;
// Margem em volta dos pontos, para nenhum ficar colado na borda do mapa
const PADDING_FACTOR = 1.4;

// Região centrada no ponto, com a área informada
export const regionAround = ({ latitude, longitude }, delta = MIN_DELTA) => ({
  latitude,
  longitude,
  latitudeDelta: delta,
  longitudeDelta: delta,
});

// Maior e menor valor de uma coordenada entre os pontos
function rangeOf(values) {
  return { min: Math.min(...values), max: Math.max(...values) };
}

// Tamanho da área que cobre o intervalo, com margem (e um mínimo)
const deltaOf = ({ min, max }) =>
  Math.max((max - min) * PADDING_FACTOR, MIN_DELTA);

// Região que mostra todos os pontos ({ latitude, longitude }), com margem
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
