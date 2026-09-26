import {
  getPhotoCoords,
  getPhotoDate,
  getPhotosMetadata,
  getPhotoTimeZone,
} from '../photoMetadata';

const BRT = { offsetMinutes: -180, abbreviation: 'BRT' };

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

    it('deve usar o local registrado ao fotografar quando não houver GPS', () => {
      const result = getPhotosMetadata([
        { uri: 'a', coords: { latitude: 3, longitude: 4 } },
        { uri: 'b', exif: { GPSLatitude: 1, GPSLongitude: 2 } },
      ]);

      expect(result.coords).toEqual({ latitude: 3, longitude: 4 });
    });

    it('deve preferir o GPS da foto ao local registrado pelo app', () => {
      const result = getPhotosMetadata([
        {
          uri: 'a',
          exif: { GPSLatitude: 1, GPSLongitude: 2 },
          coords: { latitude: 3, longitude: 4 },
        },
      ]);

      expect(result.coords).toEqual({ latitude: 1, longitude: 2 });
    });

    it('deve retornar nulos quando as fotos não tiverem metadados', () => {
      expect(getPhotosMetadata([{ uri: 'a' }])).toEqual({
        coords: null,
        occurredAt: null,
        occurredZone: null,
      });
    });
  });

  describe('fuso horário da foto', () => {
    it('deve usar o fuso gravado na foto para calcular a data', () => {
      expect(
        getPhotoDate({
          DateTimeOriginal: '2026:09:25 14:30:00',
          OffsetTimeOriginal: '+09:00',
        }).toISOString()
      ).toBe('2026-09-25T05:30:00.000Z');
      expect(
        getPhotoDate({
          '{Exif}': {
            DateTimeOriginal: '2026:09:25 14:30:00',
            OffsetTimeOriginal: '-05:30',
          },
        }).toISOString()
      ).toBe('2026-09-25T20:00:00.000Z');
    });

    it('deve ignorar um fuso em formato inválido', () => {
      expect(
        getPhotoDate({
          DateTimeOriginal: '2026:09:25 14:30:00',
          OffsetTimeOriginal: 'GMT-3',
        })
      ).toEqual(new Date(2026, 8, 25, 14, 30, 0));
    });

    it('deve usar o fuso do aparelho quando a foto não tiver fuso ou tiver o mesmo', () => {
      const date = new Date(2026, 8, 25, 14, 30);
      expect(getPhotoTimeZone({}, date)).toEqual(BRT);
      expect(getPhotoTimeZone({ OffsetTimeOriginal: '-03:00' }, date)).toEqual(
        BRT
      );
    });

    it('deve usar o fuso da foto, sem sigla, quando for de outro lugar', () => {
      expect(
        getPhotoTimeZone({ OffsetTimeOriginal: '+09:00' }, new Date())
      ).toEqual({ offsetMinutes: 540, abbreviation: null });
    });

    it('deve devolver o fuso da foto mais antiga', () => {
      const result = getPhotosMetadata([
        {
          uri: 'a',
          exif: {
            DateTimeOriginal: '2026:09:25 10:00:00',
            OffsetTimeOriginal: '+01:00',
          },
        },
        { uri: 'b', exif: { DateTimeOriginal: '2026:09:26 10:00:00' } },
      ]);

      expect(result.occurredZone).toEqual({
        offsetMinutes: 60,
        abbreviation: null,
      });
    });
  });
});
