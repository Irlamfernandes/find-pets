import { getPetFields, getPetTitle } from '../petDescription';

describe('petDescription', () => {
  const post = {
    petName: 'Rex',
    species: 'Cachorro',
    size: 'Médio',
    sex: 'Macho',
    color: 'Caramelo',
    breed: 'Vira-lata',
  };

  it('deve listar cada dado do pet com seu rótulo', () => {
    expect(getPetFields(post)).toEqual([
      { label: 'Nome', value: 'Rex' },
      { label: 'Espécie', value: 'Cachorro' },
      { label: 'Porte', value: 'Médio' },
      { label: 'Sexo', value: 'Macho' },
      { label: 'Cor', value: 'Caramelo' },
      { label: 'Raça', value: 'Vira-lata' },
    ]);
  });

  it('deve poder deixar o nome de fora', () => {
    expect(getPetFields(post, { includeName: false })[0]).toEqual({
      label: 'Espécie',
      value: 'Cachorro',
    });
  });

  it('deve omitir campos vazios e o sexo desconhecido', () => {
    expect(getPetFields({ species: 'Gato', sex: 'Não sei' })).toEqual([
      { label: 'Espécie', value: 'Gato' },
    ]);
    expect(getPetFields({})).toEqual([]);
  });

  it('deve usar o nome como título ou, sem nome, a espécie', () => {
    expect(getPetTitle(post)).toBe('Rex');
    expect(getPetTitle({ species: 'Gato' })).toBe('Gato');
    expect(getPetTitle({})).toBe('');
  });
});
