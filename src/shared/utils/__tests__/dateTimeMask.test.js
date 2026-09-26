import {
  formatDateInput,
  formatTimeInput,
  toDateInput,
  toTimeInput,
  parseDateTimeInput,
} from '../dateTimeMask';

describe('dateTimeMask', () => {
  it('deve formatar a data progressivamente como dd/mm/aaaa', () => {
    expect(formatDateInput('')).toBe('');
    expect(formatDateInput(undefined)).toBe('');
    expect(formatDateInput('2')).toBe('2');
    expect(formatDateInput('250')).toBe('25/0');
    expect(formatDateInput('25092026')).toBe('25/09/2026');
    expect(formatDateInput('25/09/2026999')).toBe('25/09/2026');
  });

  it('deve formatar a hora progressivamente como HH:MM', () => {
    expect(formatTimeInput(null)).toBe('');
    expect(formatTimeInput('14')).toBe('14');
    expect(formatTimeInput('143')).toBe('14:3');
    expect(formatTimeInput('14:305')).toBe('14:30');
  });

  it('deve converter datas para os campos com zeros à esquerda', () => {
    const date = new Date(2026, 0, 5, 7, 3);
    expect(toDateInput(date)).toBe('05/01/2026');
    expect(toTimeInput(date)).toBe('07:03');
  });

  it('deve interpretar data e hora válidas', () => {
    expect(parseDateTimeInput('25/09/2026', '14:30')).toEqual(
      new Date(2026, 8, 25, 14, 30)
    );
  });

  it('deve rejeitar formatos incompletos e datas inexistentes', () => {
    expect(parseDateTimeInput('25/09/26', '14:30')).toBeNull();
    expect(parseDateTimeInput('25/09/2026', '1430')).toBeNull();
    expect(parseDateTimeInput(undefined, undefined)).toBeNull();
    expect(parseDateTimeInput('31/02/2026', '10:00')).toBeNull();
    expect(parseDateTimeInput('25/13/2026', '10:00')).toBeNull();
    expect(parseDateTimeInput('25/09/2026', '25:00')).toBeNull();
    expect(parseDateTimeInput('25/09/2026', '10:60')).toBeNull();
  });
});
