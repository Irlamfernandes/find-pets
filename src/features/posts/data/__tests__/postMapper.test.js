import { toPostRow, fromPostRow, toApiPost, fromApiPost } from '../postMapper';

const ZONE = { offsetMinutes: -180, abbreviation: 'BRT' };
const FOUND = { receiverName: 'Ana', foundAt: '2026-10-15T12:00:00.000Z' };

const POST = {
  id: 'p1',
  author: 'ana@x.com',
  images: ['a.jpg', 'b.jpg'],
  petName: 'Rex',
  species: 'Cachorro',
  size: 'Médio',
  sex: 'Macho',
  color: 'Caramelo',
  breed: 'SRD',
  description: 'Coleira azul',
  latitude: -23.5,
  longitude: -46.6,
  location: 'Rua A, 10',
  occurredAt: '2026-10-14T10:00:00.000Z',
  occurredZone: ZONE,
  status: 'Encontrado',
  contactPhone: '5511999999999',
  foundInfo: FOUND,
};

const ROW = {
  id: 'p1',
  author_id: 'ana@x.com',
  pet_name: 'Rex',
  species: 'Cachorro',
  size: 'Médio',
  sex: 'Macho',
  color: 'Caramelo',
  breed: 'SRD',
  description: 'Coleira azul',
  latitude: -23.5,
  longitude: -46.6,
  location: 'Rua A, 10',
  occurred_at: '2026-10-14T10:00:00.000Z',
  occurred_zone: JSON.stringify(ZONE),
  status: 'Encontrado',
  contact_phone: '5511999999999',
  found_info: JSON.stringify(FOUND),
};

describe('postMapper', () => {
  it('deve converter o registro em linha da tabela, sem as fotos', () => {
    expect(toPostRow(POST)).toEqual(ROW);
  });

  it('deve converter a linha de volta no registro, com as fotos', () => {
    expect(fromPostRow(ROW, ['a.jpg', 'b.jpg'])).toEqual(POST);
  });

  it('deve gravar nulo nos campos vazios e o status padrão (Perdido)', () => {
    const row = toPostRow({ id: 'p2' });

    expect(row.status).toBe('Perdido');
    expect(row.pet_name).toBeNull();
    expect(row.found_info).toBeNull();
  });

  it('deve ler um registro sem fotos', () => {
    const post = fromPostRow({ ...ROW, found_info: null });

    expect(post.images).toEqual([]);
    expect(post.foundInfo).toBeNull();
  });

  it('deve informar se o registro aguarda envio', () => {
    expect(fromPostRow({ ...ROW, sync_status: 'pending' }).syncStatus).toBe(
      'pending'
    );
  });

  it('deve montar o registro da API com as datas e as fotos enviadas', () => {
    const row = {
      ...ROW,
      created_at: 'c',
      updated_at: 'u',
      deleted_at: null,
      sync_status: 'pending',
    };

    expect(toApiPost(row, ['http://api/a.jpg'])).toMatchObject({
      id: 'p1',
      petName: 'Rex',
      occurredZone: ZONE,
      images: ['http://api/a.jpg'],
      createdAt: 'c',
      updatedAt: 'u',
      deletedAt: null,
    });
    expect(toApiPost(row, [])).not.toHaveProperty('syncStatus');
  });

  it('deve converter o registro da API em linha já sincronizada', () => {
    const row = fromApiPost({
      ...POST,
      createdAt: 'c',
      updatedAt: 'u',
      deletedAt: 'd',
    });

    expect(row).toEqual({
      ...ROW,
      created_at: 'c',
      updated_at: 'u',
      deleted_at: 'd',
      sync_status: 'synced',
    });
  });
});
