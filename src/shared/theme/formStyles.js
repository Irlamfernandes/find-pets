import { StyleSheet } from 'react-native';
import { palette } from './colors';

// Estilos comuns aos formulários do app
export const formStyles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: palette.text,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: palette.text,
  },
  inputLocked: {
    backgroundColor: palette.background,
    color: palette.textMuted,
  },
  inputError: { borderColor: palette.error },
  fieldError: { color: palette.error, fontSize: 13, marginTop: 6 },
  hint: { fontSize: 12, color: palette.textMuted, marginTop: 4 },
  primaryButton: {
    backgroundColor: palette.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  primaryButtonText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  secondaryButtonText: {
    color: palette.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
