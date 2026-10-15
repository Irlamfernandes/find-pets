// Endereço da API (ver .env.example). O Expo troca a variável pelo valor
// no momento do build, por isso ela precisa ser lida exatamente assim.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(
  /\/+$/,
  ''
);
