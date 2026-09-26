import {
  getTimeZoneInfo,
  formatUtcOffset,
  formatTimeZone,
  formatDateTime,
} from '../timeZone';

// A suíte roda com TZ=America/Sao_Paulo (jest.globalSetup.js)
describe('timeZone', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getTimeZoneInfo', () => {
    it('deve devolver o deslocamento e a sigla do fuso do aparelho', () => {
      expect(getTimeZoneInfo(new Date(2026, 8, 25))).toEqual({
        offsetMinutes: -180,
        abbreviation: 'BRT',
      });
      expect(getTimeZoneInfo().offsetMinutes).toBe(-180);
    });

    it('deve procurar a sigla em inglês quando não houver em português', () => {
      const formatToParts = jest
        .fn()
        .mockReturnValueOnce([{ type: 'timeZoneName', value: 'GMT-4' }])
        .mockReturnValueOnce([{ type: 'timeZoneName', value: 'EDT' }]);
      jest
        .spyOn(Intl, 'DateTimeFormat')
        .mockImplementation(() => ({ formatToParts }));

      expect(getTimeZoneInfo(new Date()).abbreviation).toBe('EDT');
    });

    it('deve ficar sem sigla quando o aparelho não informar uma', () => {
      jest
        .spyOn(Intl, 'DateTimeFormat')
        .mockImplementationOnce(() => ({ formatToParts: () => [] }))
        .mockImplementationOnce(() => {
          throw new Error('Intl indisponível');
        });

      expect(getTimeZoneInfo(new Date()).abbreviation).toBeNull();
    });
  });

  describe('formatUtcOffset', () => {
    it('deve formatar deslocamentos inteiros, fracionados e zero', () => {
      expect(formatUtcOffset(-180)).toBe('UTC-3');
      expect(formatUtcOffset(120)).toBe('UTC+2');
      expect(formatUtcOffset(330)).toBe('UTC+5:30');
      expect(formatUtcOffset(-570)).toBe('UTC-9:30');
      expect(formatUtcOffset(0)).toBe('UTC');
    });
  });

  describe('formatTimeZone', () => {
    it('deve juntar a sigla e o deslocamento', () => {
      expect(formatTimeZone({ offsetMinutes: -180, abbreviation: 'BRT' })).toBe(
        'BRT, UTC-3'
      );
    });

    it('deve mostrar só o deslocamento sem sigla ou quando forem iguais', () => {
      expect(formatTimeZone({ offsetMinutes: 60, abbreviation: null })).toBe(
        'UTC+1'
      );
      expect(formatTimeZone({ offsetMinutes: 0, abbreviation: 'UTC' })).toBe(
        'UTC'
      );
    });
  });

  describe('formatDateTime', () => {
    const value = '2026-09-25T17:30:00.000Z';

    it('deve exibir a hora no fuso em que foi registrada', () => {
      expect(
        formatDateTime(value, { offsetMinutes: 540, abbreviation: null })
      ).toBe('26/09/2026 às 02:30 (UTC+9)');
      expect(
        formatDateTime(value, { offsetMinutes: -240, abbreviation: 'EDT' })
      ).toBe('25/09/2026 às 13:30 (EDT, UTC-4)');
    });

    it('deve usar o fuso do aparelho em registros antigos sem fuso', () => {
      expect(formatDateTime(value)).toBe('25/09/2026 às 14:30 (BRT, UTC-3)');
      expect(formatDateTime(value, { abbreviation: 'X' })).toBe(
        '25/09/2026 às 14:30 (BRT, UTC-3)'
      );
    });

    it('deve retornar vazio para datas inválidas', () => {
      expect(formatDateTime('invalida')).toBe('');
    });
  });
});
