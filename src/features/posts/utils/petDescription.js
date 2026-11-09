export function getPetFields(post, { includeName = true } = {}) {
  return [
    includeName ? { label: 'Nome', value: post.petName } : null,
    { label: 'Espécie', value: post.species },
    { label: 'Porte', value: post.size },
    { label: 'Sexo', value: post.sex === 'Não sei' ? '' : post.sex },
    { label: 'Cor', value: post.color },
    { label: 'Raça', value: post.breed },
  ].filter((field) => field?.value);
}

export function getPetTitle(post) {
  return post.petName || post.species || '';
}
