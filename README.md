# FindPets

O **FindPets** é um aplicativo mobile para ajudar a encontrar animais de estimação perdidos: o tutor registra o desaparecimento com fotos e localização, a comunidade acompanha pelo feed ou pelo mapa e entra em contato pelo WhatsApp quando encontra o pet.

O app funciona **sem internet** (dados no SQLite do celular) e **sincroniza com a API** quando a conexão volta. Ao trocar de celular, basta entrar na conta para recuperar o perfil e os registros.

---

## Integrantes

- **Daniel Souza e Silva - 202210702**
- **Irlam da Silva Fernandes - 202320668**

---

## 🚀 Funcionalidades

**Conta e acesso**

- Cadastro e login com e-mail e senha, conferidos pela API (o token fica no SecureStore).
- Desbloqueio por biometria do aparelho (Expo Local Authentication), configurável no perfil.
- Sessão persistente e opção de sair da conta.

**Perfil**

- Onboarding para completar o cadastro (nome e WhatsApp validados).
- Edição de nome, WhatsApp, foto e senha.

**Registros de pets**

- Registro de pet desaparecido com várias fotos (câmera ou galeria) e dados completos do animal.
- Localização capturada automaticamente (Expo Location) e exibida em mapa.
- Feed em lista ou em mapa geral com todos os pets perdidos (Leaflet + OpenStreetMap).
- Edição e exclusão do próprio registro (exclusão lógica).
- Marcar o pet como **reencontrado**, informando onde e quando.
- Contato direto com o tutor pelo WhatsApp.
- Cartaz de compartilhamento gerado a partir do registro.

**Offline e nuvem**

- Tudo funciona sem internet; as alterações ficam pendentes e são enviadas quando a conexão volta.
- Aviso de modo offline e indicação no card de registros ainda não enviados.
- API própria em Flask + MySQL com Docker e documentação Swagger.

---

## 🛠️ Tecnologias

| Parte        | Ferramentas                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| App          | React Native, Expo 57, JavaScript                                                                           |
| Dados no app | expo-sqlite, AsyncStorage (sessão e preferências), SecureStore (token e senha), NetInfo                     |
| Recursos     | Image Picker (câmera e galeria), Location, Local Authentication, Sharing, View Shot, WebView (mapa Leaflet) |
| API          | Python, Flask, SQLAlchemy, MySQL, JWT, bcrypt, Swagger (flasgger), Gunicorn, Docker                         |
| Qualidade    | Jest + Testing Library, pytest, ESLint, Prettier, Ruff, Husky + Commitlint, Gitleaks                        |
| CI           | GitHub Actions                                                                                              |

---

## 🧱 Arquitetura

```
src/
  app/          fluxo do app: navegação (máquina de estados)
  features/
    auth/       conta, sessão, biometria, login e desbloqueio
    profile/    cadastro e edição do perfil
    posts/      registros de pets: feed, registro, reencontro e compartilhamento
    map/        mapas (Leaflet + OpenStreetMap dentro do app)
    sync/       sincronização com a API (envio, download e conexão)
  shared/
    api/        cliente HTTP, endereço da API e envio de fotos
    database/   conexão SQLite, tabelas, migrações e comandos SQL
    ...         componentes, hooks, serviços, utilitários e tema comuns
  testing/      utilitários dos testes (banco em memória)
api/            API em Python + Flask + MySQL (ver api/README.md)
```

Cada funcionalidade é dividida em camadas, do mais puro ao visual:

- **`domain/`**: regras puras, sem tela nem armazenamento.
- **`data/`**: repositórios com o SQL e mappers entre o registro do app e a linha da tabela.
- **`api/`**: chamadas à API daquela funcionalidade.
- **`services/`**: casos de uso usados pelos hooks.
- **`hooks/`**: estado e lógica das telas.
- **`components/`** e **`screens/`**: só apresentação.

Os testes ficam em `__tests__/`, ao lado do código que testam.

### 🗄️ Banco de dados (SQLite)

Tabelas `profiles`, `posts` e `post_images` (1 registro : N fotos), criadas em `src/shared/database/`:

- ids **UUID** gerados no celular, que não se repetem entre aparelhos;
- toda tabela tem `created_at`, `updated_at` e `sync_status` (`pending` até ser enviada);
- **nada é apagado de verdade**: excluir preenche `deleted_at` (exclusão lógica);
- comandos com parâmetros `?`, evitando SQL injection;
- mudanças de estrutura viram migrações numeradas, controladas pelo `PRAGMA user_version`.

### 🔄 Offline e sincronização

1. Toda alteração é gravada primeiro no SQLite como `pending`; o card mostra "Aguardando internet para enviar ao servidor".
2. Com internet, o app **envia** os pendentes (fotos, perfil e registros) e depois **baixa** o que mudou no servidor, inclusive registros de outros usuários e exclusões.
3. Em conflito vale a alteração mais recente (`updatedAt`), decidida pela API.
4. A sincronização roda ao entrar, quando a internet volta e depois de cada alteração.

O cadastro e o primeiro login num celular precisam de internet. Depois disso, o app reabre offline com a biometria ou a senha guardada no aparelho.

### ☁️ API

API REST em `api/`, com rotas de conta, perfil, registros e fotos. O banco é escolhido pela `DATABASE_URL`, então o MySQL do Docker pode ser trocado por um banco na nuvem (como o Postgres do Supabase) sem mudar o código. Rotas, decisões e como rodar estão em [api/README.md](api/README.md); com a API no ar, a documentação Swagger fica em `http://localhost:5001/apidocs`.

---

## ✅ Qualidade

- **100% de cobertura de testes** no app (Jest) e na API (pytest).
- ESLint com limites obrigatórios: complexidade ciclomática até 6, no máximo 3 níveis de aninhamento, funções de até 80 linhas e arquivos de até 300.
- Prettier (app) e Ruff (API) para formatação.
- Husky + Commitlint: commits no padrão _Conventional Commits_ e bloqueio de commit direto na `main`.
- **CI no GitHub Actions** com dois jobs:
  - **App**: `npm audit`, Gitleaks, Prettier, ESLint, testes com cobertura, Commitlint e `expo-doctor`;
  - **API**: Ruff e pytest com cobertura.

---

## ⚙️ Como executar

1. **Clone o repositório e instale as dependências:**
   ```bash
   git clone https://github.com/Irlamfernandes/find-pets.git
   cd find-pets
   npm install --legacy-peer-deps
   ```
2. **Suba a API** (precisa do Docker):
   ```bash
   cd api && cp .env.example .env   # preencha as senhas e a JWT_SECRET
   docker compose up --build
   ```
3. **Aponte o app para a API:** copie `.env.example` para `.env` na raiz e use o IP do computador na rede (o celular não enxerga `localhost`):
   ```bash
   EXPO_PUBLIC_API_URL=http://192.168.0.10:5001
   ```
4. **Rode o app no celular:**
   ```bash
   npx expo run:android
   ```

### Testes

```bash
npm test                 # app (Jest + cobertura)
npm run lint             # ESLint
cd api && pytest         # API (depois de: pip install -r requirements-dev.txt)
```
