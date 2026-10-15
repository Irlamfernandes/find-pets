// Tira as barras do fim sem expressão regular (evita backtracking)
const withoutTrailingSlashes = (url) => {
  let end = url.length;
  while (url[end - 1] === '/') end -= 1;
  return url.slice(0, end);
};

// Endereço da API (ver .env.example). O Expo troca a variável pelo valor
// no momento do build, por isso ela precisa ser lida exatamente assim.
export const API_URL = withoutTrailingSlashes(
  process.env.EXPO_PUBLIC_API_URL || ''
);
