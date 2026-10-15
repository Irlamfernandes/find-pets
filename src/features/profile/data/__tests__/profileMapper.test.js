import { toProfileRow, fromProfileRow } from '../profileMapper';

describe('profileMapper', () => {
  it('deve converter o perfil em linha da tabela', () => {
    expect(
      toProfileRow('ana@x.com', {
        name: 'Ana',
        whatsapp: '5511999999999',
        photoUri: 'foto.jpg',
      })
    ).toEqual({
      user_id: 'ana@x.com',
      name: 'Ana',
      whatsapp: '5511999999999',
      photo_uri: 'foto.jpg',
    });
  });

  it('deve gravar nulo quando não há foto', () => {
    expect(
      toProfileRow('ana@x.com', { name: 'Ana', whatsapp: '55' }).photo_uri
    ).toBeNull();
  });

  it('deve incluir a foto só quando ela existe', () => {
    const row = { name: 'Ana', whatsapp: '55', photo_uri: null };

    expect(fromProfileRow(row)).toEqual({ name: 'Ana', whatsapp: '55' });
    expect(fromProfileRow({ ...row, photo_uri: 'f.jpg' })).toEqual({
      name: 'Ana',
      whatsapp: '55',
      photoUri: 'f.jpg',
    });
  });
});
