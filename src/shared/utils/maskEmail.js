// Esconde parte do e-mail para não expor a conta de outra pessoa:
// "irlam@gmail.com" -> "ir***@gmail.com"
export function maskEmail(email) {
  const [name, domain] = String(email || '').split('@');
  if (!name || !domain) return '***';
  return `${name.slice(0, 2)}***@${domain}`;
}
