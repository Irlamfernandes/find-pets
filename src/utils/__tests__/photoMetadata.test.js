import {
  getPhotoCoords,
  getPhotoDate,
  getPhotosMetadata,
  formatDateTime,
} from '../photoMetadata';

describe('photoMetadata', () => {
  describe('getPhotoCoords', () => {
    it('deve ler o GPS no formato do Android aplicando o hemisfério', () => {
      expect(
        getPhotoCoords({
          GPSLatitude: 23.55,
          GPSLatitudeRef: 'S',
          GPSLongitude: '46.63',
          GPSLongitudeRef: 'W',
        })
      ).toEqual({ latitude: -23.55, longitude: -46.63 });
    });

    it('deve ler o GPS no formato do iOS', () => {
      expect(
        getPhotoCoords({
          '{GPS}': {
            Latitude: 40.7,
            LatitudeRef: 'N',
            Longitude: 74,
            LongitudeRef: 'W',
          },
        })
      ).toEqual({ latitude: 40.7, longitude: -74 });
    });

    it('deve retornar null sem GPS, com valores inválidos ou 0,0', () => {
      expect(getPhotoCoords(null)).toBeNull();
      expect(getPhotoCoords({})).toBeNull();
      expect(
        getPhotoCoords({ GPSLatitude: 'abc', GPSLongitude: 10 })
      ).toBeNull();
      expect(getPhotoCoords({ GPSLatitude: 10 })).toBeNull();
      expect(getPhotoCoords({ GPSLatitude: 0, GPSLongitude: 0 })).toBeNull();
    });
  });

  describe('getPhotoDate', () => {
    it('deve ler a data original no formato do Android e do iOS', () => {
      const expected = new Date(2026, 8, 25, 14, 30, 5);
      expect(getPhotoDate({ DateTimeOriginal: '2026:09:25 14:30:05' })).toEqual(
        expected
      );
      expect(
        getPhotoDate({ '{Exif}': { DateTimeOriginal: '2026:09:25 14:30:05' } })
      ).toEqual(expected);
    });

    it('deve retornar null sem data ou com formato inválido', () => {
      expect(getPhotoDate(undefined)).toBeNull();
      expect(getPhotoDate({ DateTimeOriginal: 123 })).toBeNull();
      expect(getPhotoDate({ DateTimeOriginal: '25/09/2026' })).toBeNull();
      expect(
        getPhotoDate({ DateTimeOriginal: '9999:99:99 99:99:99' })
      ).toBeInstanceOf(Date);
    });
  });

  describe('getPhotosMetadata', () => {
    it('deve usar o primeiro GPS e a data mais antiga das fotos', () => {
      const result = getPhotosMetadata([
        { uri: 'a', exif: { DateTimeOriginal: '2026:09:25 10:00:00' } },
        {
          uri: 'b',
          exif: {
            GPSLatitude: 1,
            GPSLongitude: 2,
            DateTimeOriginal: '2026:09:24 08:00:00',
          },
        },
        {
          uri: 'c',
          exif: {
            GPSLatitude: 5,
            GPSLongitude: 6,
            DateTimeOriginal: '2026:09:26 08:00:00',
          },
        },
      ]);

      expect(result.coords).toEqual({ latitude: 1, longitude: 2 });
      expect(result.occurredAt).toEqual(new Date(2026, 8, 24, 8, 0, 0));
    });

    it('deve retornar nulos quando as fotos não tiverem metadados', () => {
      expect(getPhotosMetadata([{ uri: 'a' }])).toEqual({
        coords: null,
        occurredAt: null,
      });
    });
  });

  describe('formatDateTime', () => {
    it('deve formatar data e hora em português', () => {
      expect(formatDateTime(new Date(2026, 8, 25, 14, 30).toISOString())).toBe(
        '25/09/2026 às 14:30'
      );
    });

    it('deve retornar vazio para datas inválidas', () => {
      expect(formatDateTime('invalida')).toBe('');
    });
  });
});
