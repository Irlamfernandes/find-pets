// Mensagens dos erros do Firebase Authentication mostradas ao usuário
const MESSAGES = {
  'auth/email-already-in-use': 'Este e-mail já está cadastrado. Faça login.',
  'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
  'auth/invalid-email': 'Insira um formato de e-mail válido.',
  'auth/too-many-requests':
    'Muitas tentativas. Aguarde um pouco e tente de novo.',
  'auth/requires-recent-login':
    'Por segurança, saia e entre de novo com sua senha para trocá-la.',
};

// E-mail ou senha não conferem
const WRONG_CREDENTIALS = new Set([
  'auth/invalid-credential',
  'auth/wrong-password',
  'auth/user-not-found',
]);

// Erro de e-mail ou senha incorretos
export const isWrongCredentials = (error) => WRONG_CREDENTIALS.has(error?.code);

// Erro com a mensagem amigável, quando o código é conhecido
export function friendlyAuthError(error) {
  const message = MESSAGES[error?.code];
  return message ? new Error(message) : error;
}
