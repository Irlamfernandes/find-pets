import {
  formatPhone,
  onlyDigits,
  withCountryCode,
  PHONE_MIN_DIGITS,
} from '../../shared/utils/phoneMask';
import { rule, isFilled } from '../../shared/utils/validation';

// Estado e regras do formulário de perfil, sem dependência de tela

const EMPTY_PASSWORDS = { newPassword: '', confirmPassword: '' };

export const INITIAL_PROFILE_STATE = {
  saved: { name: '', whatsapp: '', photoUri: null },
  values: { name: '', whatsapp: '', photoUri: null, ...EMPTY_PASSWORDS },
  isEditing: false,
  isPasswordVisible: false,
};

// Perfil gravado -> valores exibidos no formulário
export function toProfileValues(profile) {
  return {
    name: profile?.name || '',
    whatsapp: formatPhone(withCountryCode(profile?.whatsapp)),
    photoUri: profile?.photoUri || null,
  };
}

// Valores do formulário -> perfil gravado (sem a foto, tratada à parte)
export function toProfileData(values) {
  return { name: values.name.trim(), whatsapp: onlyDigits(values.whatsapp) };
}

// Só acusa diferença depois que a pessoa começou a confirmar. A senha vale
// exatamente como foi digitada, como no cadastro e no login.
export function hasPasswordMismatch({ newPassword, confirmPassword }) {
  return confirmPassword.length > 0 && confirmPassword !== newPassword;
}

// Nova senha em branco (ou só espaços) significa "não trocar"
export const wantsNewPassword = ({ newPassword }) => isFilled(newPassword);

export const profileRules = [
  rule((values) => isFilled(values.name) && isFilled(values.whatsapp), {
    type: 'warning',
    title: 'Confira seus dados',
    message: 'Nome e WhatsApp precisam ser preenchidos.',
  }),
  rule((values) => onlyDigits(values.whatsapp).length >= PHONE_MIN_DIGITS, {
    type: 'warning',
    title: 'WhatsApp inválido',
    message: 'Informe um número válido com código do país e DDD.',
  }),
  rule(
    (values) =>
      !wantsNewPassword(values) ||
      values.newPassword === values.confirmPassword,
    {
      type: 'warning',
      title: 'Senhas diferentes',
      message: 'A confirmação precisa ser igual à nova senha.',
    }
  ),
];

// Ajustes aplicados ao digitar em cada campo
const FIELD_CHANGES = {
  whatsapp: (value) => ({ whatsapp: formatPhone(value) }),
  // Ao apagar a nova senha, a confirmação é limpa junto
  newPassword: (value) =>
    value ? { newPassword: value } : { ...EMPTY_PASSWORDS },
};

const applyFieldChange = (field, value) =>
  FIELD_CHANGES[field]?.(value) ?? { [field]: value };

// Volta ao modo leitura com os valores de `saved`
const lockedWith = (state, saved) => ({
  ...state,
  saved,
  values: { ...saved, ...EMPTY_PASSWORDS },
  isEditing: false,
  isPasswordVisible: false,
});

const ACTION_HANDLERS = {
  loaded: (state, { profile }) => lockedWith(state, toProfileValues(profile)),
  fieldChanged: (state, { field, value }) => ({
    ...state,
    values: { ...state.values, ...applyFieldChange(field, value) },
  }),
  editingStarted: (state) => ({ ...state, isEditing: true }),
  editingCancelled: (state) => lockedWith(state, state.saved),
  saved: (state, { photoUri }) =>
    lockedWith(state, {
      name: state.values.name.trim(),
      whatsapp: state.values.whatsapp,
      photoUri,
    }),
  passwordVisibilityToggled: (state) => ({
    ...state,
    isPasswordVisible: !state.isPasswordVisible,
  }),
};

export function profileReducer(state, action) {
  return ACTION_HANDLERS[action.type](state, action);
}
