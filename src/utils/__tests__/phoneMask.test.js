import { formatPhone, onlyDigits, withCountryCode } from '../phoneMask';

describe('phoneMask', () => {
  describe('onlyDigits', () => {
    it('deve remover caracteres não numéricos e limitar a 13 dígitos', () => {
      expect(onlyDigits('+55 (11) 99999-9999')).toBe('5511999999999');
      expect(onlyDigits('55119999999991234')).toBe('5511999999999');
    });

    it('deve retornar string vazia para valores vazios', () => {
      expect(onlyDigits('')).toBe('');
      expect(onlyDigits(null)).toBe('');
      expect(onlyDigits(undefined)).toBe('');
    });
  });

  describe('withCountryCode', () => {
    it('deve adicionar +55 em números salvos sem código do país', () => {
      expect(withCountryCode('11999999999')).toBe('5511999999999');
      expect(withCountryCode('1133334444')).toBe('551133334444');
    });

    it('deve manter números que já possuem código do país', () => {
      expect(withCountryCode('5511999999999')).toBe('5511999999999');
      expect(withCountryCode('')).toBe('');
    });
  });

  describe('formatPhone', () => {
    it('deve formatar celular completo', () => {
      expect(formatPhone('5511999999999')).toBe('+55 (11) 99999-9999');
    });

    it('deve formatar telefone fixo completo', () => {
      expect(formatPhone('551133334444')).toBe('+55 (11) 3333-4444');
    });

    it('deve formatar progressivamente enquanto o usuário digita', () => {
      expect(formatPhone('')).toBe('');
      expect(formatPhone('5')).toBe('+5');
      expect(formatPhone('55')).toBe('+55');
      expect(formatPhone('551')).toBe('+55 (1');
      expect(formatPhone('5511')).toBe('+55 (11');
      expect(formatPhone('55119')).toBe('+55 (11) 9');
      expect(formatPhone('551199999')).toBe('+55 (11) 99999');
      expect(formatPhone('5511999999')).toBe('+55 (11) 99999-9');
    });

    it('deve reformatar texto já mascarado', () => {
      expect(formatPhone('+55 (11) 99999-99999')).toBe('+55 (11) 99999-9999');
    });
  });
});
