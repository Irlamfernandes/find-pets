import {
  hasPasswordMismatch,
  wantsNewPassword,
  profileRules,
} from '../profileForm';
import { validate } from '../../../shared/utils/validation';

const values = (newPassword, confirmPassword) => ({
  name: 'Ana',
  whatsapp: '+55 (11) 99999-9999',
  photoUri: null,
  newPassword,
  confirmPassword,
});

describe('profileForm - senha', () => {
  it('deve considerar espaços como parte da senha', () => {
    expect(hasPasswordMismatch(values(' abc ', 'abc'))).toBe(true);
    expect(validate(values(' abc ', 'abc'), profileRules)).toEqual(
      expect.objectContaining({ title: 'Senhas diferentes' })
    );
    expect(validate(values(' abc ', ' abc '), profileRules)).toBeNull();
  });

  it('deve tratar uma senha só com espaços como "não trocar"', () => {
    expect(wantsNewPassword(values('   ', ''))).toBe(false);
    expect(validate(values('   ', ''), profileRules)).toBeNull();
    expect(wantsNewPassword(values('abc', 'abc'))).toBe(true);
  });
});
