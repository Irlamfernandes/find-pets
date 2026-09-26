import {
  POST_STATUS,
  getPostStatus,
  isFound,
  isOwnedBy,
  canManage,
  hasCoordinates,
  getOccurredAtLabel,
  markAsFound,
  createLostPost,
} from '../post';

const lost = { id: '1', author: 'ana@x.com', status: POST_STATUS.LOST };
const found = { ...lost, status: POST_STATUS.FOUND };

describe('post', () => {
  it('deve ler o status, inclusive de registros antigos', () => {
    expect(getPostStatus(lost)).toBe('Perdido');
    expect(getPostStatus({ type: 'Encontrado' })).toBe('Encontrado');
    expect(getPostStatus({ status: null })).toBe('Perdido');
    expect(isFound(found)).toBe(true);
    expect(isFound({ type: 'Encontrado' })).toBe(true);
    expect(isFound(lost)).toBe(false);
  });

  it('deve permitir gerenciar só o próprio registro ainda perdido', () => {
    expect(isOwnedBy(lost, 'ana@x.com')).toBe(true);
    expect(isOwnedBy(lost, 'bia@x.com')).toBe(false);
    expect(isOwnedBy({ author: null }, null)).toBe(false);

    expect(canManage(lost, 'ana@x.com')).toBe(true);
    expect(canManage(found, 'ana@x.com')).toBe(false);
    expect(canManage(lost, 'bia@x.com')).toBe(false);
  });

  it('deve exigir latitude e longitude numéricas', () => {
    expect(hasCoordinates({ latitude: -23.5, longitude: -46.6 })).toBe(true);
    expect(hasCoordinates({ latitude: null, longitude: -46.6 })).toBe(false);
    expect(hasCoordinates({})).toBe(false);
  });

  it('deve mostrar a data no fuso registrado ou a data antiga', () => {
    expect(
      getOccurredAtLabel({
        occurredAt: '2026-09-25T17:30:00.000Z',
        occurredZone: { offsetMinutes: -180, abbreviation: 'BRT' },
      })
    ).toBe('25/09/2026 às 14:30 (BRT, UTC-3)');
    expect(getOccurredAtLabel({ date: '10/06/2026' })).toBe('10/06/2026');
    expect(getOccurredAtLabel({})).toBe('Data não informada');
    expect(getOccurredAtLabel({ occurredAt: 'lixo' })).toBe(
      'Data não informada'
    );
  });

  it('deve registrar o reencontro', () => {
    expect(markAsFound({ receiverName: 'Ana' })).toEqual({
      status: 'Encontrado',
      foundInfo: { receiverName: 'Ana' },
    });
  });

  it('deve criar o registro de um pet perdido', () => {
    const occurredAt = new Date(2026, 8, 24, 9, 15);
    const zone = { offsetMinutes: -180, abbreviation: 'BRT' };

    expect(
      createLostPost({
        id: '10',
        author: 'ana@x.com',
        images: ['a.jpg', 'b.jpg'],
        petData: { species: 'Gato' },
        location: { latitude: 1, longitude: 2, location: 'Rua A' },
        occurredAt,
        occurredZone: zone,
        contactPhone: '5511999999999',
      })
    ).toEqual({
      id: '10',
      author: 'ana@x.com',
      images: ['a.jpg', 'b.jpg'],
      imageUri: 'a.jpg',
      species: 'Gato',
      latitude: 1,
      longitude: 2,
      location: 'Rua A',
      occurredAt: occurredAt.toISOString(),
      occurredZone: zone,
      date: '24/09/2026',
      type: 'Perdido',
      status: 'Perdido',
      contactPhone: '5511999999999',
    });
  });

  it('deve deixar autor e contato nulos quando ausentes', () => {
    const post = createLostPost({
      id: '1',
      images: ['a.jpg'],
      petData: {},
      location: {},
      occurredAt: new Date(),
    });
    expect(post.author).toBeNull();
    expect(post.contactPhone).toBeNull();
  });
});
