import {
  toDateInput,
  toTimeInput,
  parseDateTimeInput,
} from '../../../shared/utils/dateTimeMask';
import { getTimeZoneInfo } from '../../../shared/utils/timeZone';
import { rule, isFilled } from '../../../shared/utils/validation';

// Formulário do reencontro de um pet

export const FOUND_RELATIONS = [
  'Dono(a) / tutor',
  'Familiar',
  'Vizinho / conhecido',
  'Abrigo / ONG',
  'Outro',
];

// Começa com o nome vazio, a primeira relação e a data/hora atual
export function createFoundForm(now = new Date()) {
  return {
    receiverName: '',
    receiverRelation: FOUND_RELATIONS[0],
    date: toDateInput(now),
    time: toTimeInput(now),
    foundLocation: '',
    notes: '',
  };
}

const getFoundAt = (form) => parseDateTimeInput(form.date, form.time);

// A data digitada não tem segundos: compara a partir do minuto do sumiço
function startOfMinute(value) {
  const date = new Date(value);
  date.setSeconds(0, 0);
  return date;
}

export const foundFormRules = [
  rule(
    (form) => isFilled(form.receiverName),
    'Informe o nome de quem pegou o animal.'
  ),
  rule(
    (form) => getFoundAt(form) !== null,
    'Informe uma data (dd/mm/aaaa) e hora (HH:MM) válidas.'
  ),
  rule(
    (form) => getFoundAt(form) <= new Date(),
    'A data do reencontro não pode estar no futuro.'
  ),
  rule(
    (form) => !form.lostAt || getFoundAt(form) >= startOfMinute(form.lostAt),
    'A data do reencontro não pode ser anterior ao desaparecimento.'
  ),
];

// Dados gravados no registro (o formulário já deve ter sido validado)
export function toFoundInfo(form) {
  const foundAt = getFoundAt(form);
  return {
    receiverName: form.receiverName.trim(),
    receiverRelation: form.receiverRelation,
    foundAt: foundAt.toISOString(),
    foundZone: getTimeZoneInfo(foundAt),
    foundLocation: form.foundLocation.trim(),
    notes: form.notes.trim(),
  };
}
