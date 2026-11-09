import { locationService } from '../../../shared/services/locationService';

const fromPhoto = async ({ photoCoords }) => photoCoords || null;

const fromAddress = ({ address }) =>
  locationService.getCoordsFromAddress(address);

const fromDevice = async () => {
  const { latitude, longitude } = await locationService.getCurrentLocation();
  return latitude !== null && longitude !== null
    ? { latitude, longitude }
    : null;
};

export const COORDS_SOURCES = [fromPhoto, fromAddress, fromDevice];

export async function findFirstCoords(sources, context) {
  for (const source of sources) {
    const coords = await source(context);
    if (coords) return coords;
  }
  return null;
}

async function describeCoords({ latitude, longitude }) {
  const address = await locationService.getAddressFromCoords(
    latitude,
    longitude
  );
  return address || `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
}

const toLocation = (coords, location) => ({
  latitude: coords?.latitude ?? null,
  longitude: coords?.longitude ?? null,
  location,
});

export async function resolveNewPostLocation({ photoCoords, address }) {
  const coords = await findFirstCoords(COORDS_SOURCES, {
    photoCoords,
    address,
  });
  const described = coords && !address ? await describeCoords(coords) : '';
  return toLocation(
    coords,
    address || described || 'Localização não informada'
  );
}

export async function resolveEditedLocation(post, address) {
  const current = toLocation(post, post.location);
  if (!address || address === post.location) return current;

  const coords = await locationService.getCoordsFromAddress(address);
  return toLocation(coords || current, address);
}
