import {
  FOUND_RELATIONS,
  createFoundForm,
  foundFormRules,
  toFoundInfo,
} from '../foundForm';
import { validate } from '../../../../shared/utils/validation';

describe('foundForm', () => {
  const valid = {
    ...createFoundForm(new Date(2026, 8, 24, 9, 30)),
    receiverName: ' Ana ',
    foundLocation: ' Praça ',
    notes: ' Tudo bem ',
  };

  it('deve começar com o nome vazio, a primeira relação e a data informada', () => {
    expect(createFoundForm(new Date(2026, 0, 5, 7, 3))).toEqual({
      receiverName: '',
      receiverRelation: FOUND_RELATIONS[0],
      date: '05/01/2026',
      time: '07:03',
      foundLocation: '',
      notes: '',
    });
    expect(createFoundForm().date).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('deve validar o nome, a data e se não está no futuro', () => {
    expect(validate(valid, foundFormRules)).toBeNull();
    expect(validate({ ...valid, receiverName: ' ' }, foundFormRules)).toBe(
      'Informe o nome de quem pegou o animal.'
    );
    expect(validate({ ...valid, date: '31/02/2026' }, foundFormRules)).toBe(
      'Informe uma data (dd/mm/aaaa) e hora (HH:MM) válidas.'
    );
    expect(validate({ ...valid, date: '01/01/2999' }, foundFormRules)).toBe(
      'A data do reencontro não pode estar no futuro.'
    );
  });

  it('deve converter o formulário nos dados do reencontro', () => {
    expect(toFoundInfo(valid)).toEqual({
      receiverName: 'Ana',
      receiverRelation: FOUND_RELATIONS[0],
      foundAt: new Date(2026, 8, 24, 9, 30).toISOString(),
      foundZone: { offsetMinutes: -180, abbreviation: 'BRT' },
      foundLocation: 'Praça',
      notes: 'Tudo bem',
    });
  });
});
