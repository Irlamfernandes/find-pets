import { getPosterContent } from '../posterContent';

describe('getPosterContent', () => {
  const lostPost = {
    images: ['file:///docs/post-photo-1.jpg', 'file:///docs/post-photo-2.jpg'],
    petName: 'Rex',
    species: 'Cachorro',
    size: 'Médio',
    sex: 'Macho',
    color: 'Caramelo',
    description: 'Coleira azul.',
    occurredAt: new Date(2026, 8, 25, 14, 30).toISOString(),
    location: 'Av. Paulista, 1000',
    contactPhone: '5511999999999',
    status: 'Perdido',
  };

  it('deve montar o conteúdo do cartaz de um pet perdido', () => {
    expect(getPosterContent(lostPost)).toEqual({
      isFound: false,
      headline: 'PROCURA-SE',
      image: 'file:///docs/post-photo-1.jpg',
      title: 'Rex',
      fields: [
        { label: 'Espécie', value: 'Cachorro' },
        { label: 'Porte', value: 'Médio' },
        { label: 'Sexo', value: 'Macho' },
        { label: 'Cor', value: 'Caramelo' },
      ],
      occurredAt: '25/09/2026 às 14:30 (BRT, UTC-3)',
      location: 'Av. Paulista, 1000',
      description: 'Coleira azul.',
      phone: '+55 (11) 99999-9999',
    });
  });

  it('deve esconder o contato no cartaz de um pet encontrado', () => {
    expect(getPosterContent({ ...lostPost, status: 'Encontrado' })).toEqual(
      expect.objectContaining({
        isFound: true,
        headline: 'ENCONTRADO',
        phone: '',
      })
    );
  });

  it('deve aceitar registros antigos, sem os campos novos', () => {
    expect(
      getPosterContent({
        type: 'Perdido',
        imageUri: 'file:///antiga.jpg',
        date: '10/06/2026',
      })
    ).toEqual({
      isFound: false,
      headline: 'PROCURA-SE',
      image: 'file:///antiga.jpg',
      title: 'Pet',
      fields: [],
      occurredAt: '10/06/2026',
      location: '',
      description: '',
      phone: '',
    });
  });
});
