// Converte o perfil usado pelo app ({ name, whatsapp, photoUri }) na linha
// da tabela profiles e vice-versa

export const toProfileRow = (userId, profile) => ({
  user_id: userId,
  name: profile.name,
  whatsapp: profile.whatsapp,
  photo_uri: profile.photoUri || null,
});

// A foto só aparece no perfil quando existe
export function fromProfileRow(row) {
  const profile = { name: row.name, whatsapp: row.whatsapp };
  return row.photo_uri ? { ...profile, photoUri: row.photo_uri } : profile;
}
