// Monta os dados de identificação do pet a partir dos campos do registro

// Lista de dados com rótulo, só com o que foi preenchido:
// [{ label: 'Nome', value: 'Rex' }, { label: 'Espécie', value: 'Cachorro' }, ...]
export function getPetFields(post, { includeName = true } = {}) {
  return [
    includeName ? { label: 'Nome', value: post.petName } : null,
    { label: 'Espécie', value: post.species },
    { label: 'Porte', value: post.size },
    // "Não sei" não ajuda a identificar o pet
    { label: 'Sexo', value: post.sex === 'Não sei' ? '' : post.sex },
    { label: 'Cor', value: post.color },
    { label: 'Raça', value: post.breed },
  ].filter((field) => field?.value);
}

// Título do cartaz: o nome do pet ou, sem nome, a espécie
export function getPetTitle(post) {
  return post.petName || post.species || '';
}
