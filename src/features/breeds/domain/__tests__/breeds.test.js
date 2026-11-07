import { dogBreedNames, normalize, searchBreeds } from '../breeds';

describe('breeds (regras das raças)', () => {
  it('deve comparar sem acentos, maiúsculas nem espaços nas pontas', () => {
    expect(normalize('  Pastor Alemão ')).toBe('pastor alemao');
  });

  it('deve transformar a lista da Dog CEO em nomes de raça', () => {
    expect(
      dogBreedNames({ beagle: [], bulldog: ['boston', 'french'] })
    ).toEqual(['Beagle', 'Bulldog', 'Boston Bulldog', 'French Bulldog']);
  });

  it('deve pôr a variação depois quando a chave da Dog CEO é um adjetivo', () => {
    expect(dogBreedNames({ german: ['shepherd'], collie: ['border'] })).toEqual(
      ['German Shepherd', 'Collie', 'Border Collie']
    );
  });

  it('deve sugerir só a partir de 2 letras', () => {
    expect(searchBreeds(['Beagle'], '')).toEqual([]);
    expect(searchBreeds(['Beagle'], ' b ')).toEqual([]);
    expect(searchBreeds(['Beagle'], 'be')).toEqual(['Beagle']);
  });

  it('deve trazer primeiro as raças que começam com o texto', () => {
    const breeds = ['French Bulldog', 'Bulldog Inglês', 'Beagle'];

    expect(searchBreeds(breeds, 'BULL')).toEqual([
      'Bulldog Inglês',
      'French Bulldog',
    ]);
  });

  it('deve ignorar acentos e não sugerir a raça já digitada', () => {
    const breeds = ['Siamês', 'Siamês Tradicional'];

    expect(searchBreeds(breeds, 'siames')).toEqual(['Siamês Tradicional']);
  });

  it('deve sugerir no máximo 5 raças', () => {
    const breeds = ['Terrier A', 'Terrier B', 'Terrier C', 'Terrier D'];

    expect(searchBreeds([...breeds, 'Terrier E', 'Terrier F'], 'ter')).toEqual([
      ...breeds,
      'Terrier E',
    ]);
  });
});
