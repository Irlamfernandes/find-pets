# FindPets

O **FindPets** é um aplicativo mobile para ajudar a encontrar animais de estimação perdidos: o tutor registra o desaparecimento com fotos e localização, a comunidade acompanha pelo feed ou pelo mapa e entra em contato pelo WhatsApp quando encontra o pet.

O app funciona **sem internet** (dados no SQLite do celular) e **sincroniza com o Firebase** quando a conexão volta. Ao trocar de celular, basta entrar na conta para recuperar o perfil e os registros.

---

## Integrantes

- **Daniel Souza e Silva - 202210702**
- **Irlam da Silva Fernandes - 202320668**

---

## 🚀 Funcionalidades

**Conta e acesso**

- Cadastro e login com e-mail e senha pelo **Firebase Authentication** (o login fica guardado no aparelho).
- Desbloqueio por biometria do aparelho (Expo Local Authentication), configurável no perfil.
- Sessão persistente e opção de sair da conta.

**Perfil**

- Onboarding para completar o cadastro (nome e WhatsApp validados).
- Edição de nome, WhatsApp, foto e senha.

**Registros de pets**

- Registro de pet desaparecido com várias fotos (câmera ou galeria) e dados completos do animal.
- Localização capturada automaticamente (Expo Location) e exibida em mapa.
- Feed em lista ou em mapa geral com todos os pets perdidos (mapa nativo do Expo, `react-native-maps`).
- Edição e exclusão do próprio registro (exclusão lógica).
- Marcar o pet como **reencontrado**, informando onde e quando.
- Contato direto com o tutor pelo WhatsApp.
- Cartaz de compartilhamento gerado a partir do registro.

**Offline e nuvem**

- Tudo funciona sem internet; as alterações ficam pendentes e são enviadas ao **Firebase Realtime Database** quando a conexão volta.
- Aviso de modo offline e indicação no card de registros ainda não enviados.
- API própria em Flask + MySQL com Docker e Swagger (etapa anterior do projeto, mantida em `api/`).

---

## 🛠️ Tecnologias

| Parte        | Ferramentas                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------- |
| App          | React Native 0.88, Expo SDK 58, JavaScript (Node.js 22.13 ou mais novo)                                             |
| Dados no app | expo-sqlite (banco e kv-store para sessão e preferências), expo-secure-store (senha), expo-network                  |
| Nuvem        | Firebase Authentication e Realtime Database, Image Manipulator (fotos reduzidas em base64)                          |
| Recursos     | expo-image-picker, expo-image, expo-location, expo-local-authentication, expo-sharing, View Shot, react-native-maps |
| API          | Python, Flask, SQLAlchemy, MySQL, JWT, bcrypt, Swagger (flasgger), Gunicorn, Docker                                 |
| Qualidade    | Jest + Testing Library, pytest, Maestro (E2E), ESLint, Prettier, Ruff, SonarQube, Husky + Commitlint, Gitleaks      |
| CI           | GitHub Actions                                                                                                      |

---

## 🧱 Arquitetura

```
src/
  app/          fluxo do app: navegação (máquina de estados)
  features/
    auth/       conta, sessão, biometria, login e desbloqueio
    profile/    cadastro e edição do perfil
    posts/      registros de pets: feed, registro, reencontro e compartilhamento
    map/        mapas nativos (react-native-maps): ponto do registro e mapa geral
    sync/       sincronização com o Firebase (envio, download e conexão)
  shared/
    firebase/   projeto do Firebase, leitura e gravação no Realtime Database
    database/   conexão SQLite, tabelas, migrações e comandos SQL
    ...         componentes, hooks, serviços, utilitários e tema comuns
  testing/      utilitários dos testes (SQLite e Firebase em memória)
api/            API em Python + Flask + MySQL (ver api/README.md)
```

Cada funcionalidade é dividida em camadas, do mais puro ao visual:

- **`domain/`**: regras puras, sem tela nem armazenamento.
- **`data/`**: repositórios com o SQL e mappers entre o registro do app e a linha da tabela.
- **`api/`**: leitura e gravação daquela funcionalidade no Firebase.
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
2. Com internet, o app **envia** os pendentes (fotos, perfil e registros) e depois **baixa** o que mudou no Firebase, inclusive registros de outros usuários e exclusões.
3. Em conflito vale a alteração mais recente (`updatedAt`): uma versão mais nova já gravada por outro celular é mantida.
4. A sincronização roda ao entrar, quando a internet volta e depois de cada alteração.

O cadastro e o primeiro login num celular precisam de internet. Depois disso, o app reabre offline com a biometria ou a senha guardada no aparelho.

### ☁️ Firebase

Segue o modelo dos exemplos da disciplina ([LPAH-2024-Firebase](https://github.com/FUSVE/LPAH-2024-Firebase) e [LPAH-2026-SQLITE-FIREBASE](https://github.com/FUSVE/LPAH-2026-SQLITE-FIREBASE)): o app fala direto com o Firebase, sem servidor próprio.

```
profiles/<uid>   perfil de cada conta (nome, WhatsApp e foto)
posts/<id>       registros de todos os usuários, com authorUid e serverUpdatedAt
```

- **Login**: Firebase Authentication com e-mail e senha.
- **Fotos**: reduzidas para 800 px e gravadas no próprio registro como texto (base64), o que mantém o projeto no plano gratuito (o Firebase Storage exige o plano pago).
- **Baixar só o que mudou**: cada gravação leva a hora do servidor (`serverUpdatedAt`), e o app pede só o que veio depois da última sincronização.
- **Segurança**: as regras em [database.rules.json](database.rules.json) só deixam ler com login, cada conta ver o próprio perfil e só o autor alterar o próprio registro.

### 🐍 API (etapa anterior)

API REST em `api/` (Flask + MySQL + Docker + Swagger), usada pelo app antes do Firebase. Continua no repositório com testes e documentação: ver [api/README.md](api/README.md).

---

## ✅ Qualidade

- **100% de cobertura de testes** (linhas e ramos) no app (Jest) e na API (pytest com `--cov-branch`).
- **Testes de ponta a ponta no celular** com [Maestro](https://maestro.mobile.dev), em `.maestro/`.
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
2. **Crie o projeto no [console do Firebase](https://console.firebase.google.com/):**
   - adicione um app **Web** (`</>`) e copie a configuração;
   - em **Authentication**, ative o login por **E-mail/senha**;
   - crie o **Realtime Database** e, na aba **Regras**, cole o conteúdo de [database.rules.json](database.rules.json).
3. **Configure o app:** copie `.env.example` para `.env` e preencha com a configuração do app Web.
4. **Rode o app no celular** (pelo Expo Go, lendo o QR code):
   ```bash
   npx expo start
   ```

### Testes

```bash
npm test                 # app (Jest + cobertura)
npm run lint             # ESLint
cd api && pytest         # API (depois de: pip install -r requirements-dev.txt)
```

### Testes de ponta a ponta (Maestro)

Os fluxos em [.maestro/telas/](.maestro/telas) usam o app de verdade no celular, como um usuário. Eles percorrem o app **uma tela por vez, em ordem**, numa conta nova criada no começo:

| Tela                | Verificação completa                                                             |
| ------------------- | -------------------------------------------------------------------------------- |
| `01-tela-inicial`   | Textos da tela e navegação para o login e de volta                               |
| `02-cadastro`       | Campos vazios, e-mail sem formato válido e senha curta (recusada pelo Firebase)  |
| `03-perfil-inicial` | Campos vazios e WhatsApp curto                                                   |
| `04-feed`           | Guia de uso, lista e mapa, e o botão de ajuda                                    |
| `05-registro`       | Registro sem foto não é salvo                                                    |
| `06-perfil`         | Senha vazia e errada para editar, senhas diferentes e troca do nome              |
| `07-offline`        | Com o modo avião, o app avisa e continua funcionando; o aviso some ao reconectar |
| `08-sair-e-entrar`  | E-mail já cadastrado, senha errada e login com a senha certa                     |

Cada tela tem duas partes: a **verificação completa** e o **caminho feliz** (o mínimo para chegar à próxima tela). Na primeira vez, cada tela faz a verificação completa; depois de aprovada, faz só o caminho feliz, o que deixa as execuções seguintes bem mais rápidas. As telas aprovadas ficam anotadas em `.maestro/.aprovadas`, só no seu computador. Se uma tela falhar, a execução para nela.

1. Instale o `adb` e o Maestro:
   ```bash
   sudo apt install adb
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```
2. No celular, ative as **Opções do desenvolvedor** e a **Depuração USB**, conecte no cabo e confira com `adb devices`.
3. Com o `npx expo start` rodando:
   ```bash
   npm run test:e2e              # verifica as telas ainda não aprovadas
   npm run test:e2e -- --tudo    # esquece as aprovações e verifica tudo
   ```
