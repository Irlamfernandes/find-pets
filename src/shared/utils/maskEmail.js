export function maskEmail(email) {
  const [name, domain] = String(email || '').split('@');
  if (!name || !domain) return '***';
  return `${name.slice(0, 2)}***@${domain}`;
}
