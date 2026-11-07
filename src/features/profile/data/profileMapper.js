export const toProfileRow = (userId, profile) => ({
  user_id: userId,
  name: profile.name,
  whatsapp: profile.whatsapp,
  photo_uri: profile.photoUri || null,
});

export function fromProfileRow(row) {
  const profile = { name: row.name, whatsapp: row.whatsapp };
  return row.photo_uri ? { ...profile, photoUri: row.photo_uri } : profile;
}
