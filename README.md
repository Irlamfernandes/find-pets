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
- Sugestões de raça ao digitar, vindas de APIs públicas e gratuitas (sem chave): [Dog CEO](https://dog.ceo/dog-api/) para cachorros e [Cat Facts](https://catfact.ninja) para gatos. A lista fica guardada no aparelho e funciona offline.
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

| Parte         | Ferramentas                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| App           | React Native 0.88, Expo SDK 58, JavaScript (Node.js 22.13 ou mais novo)                                             |
| Dados no app  | expo-sqlite (banco e kv-store para sessão e preferências), expo-secure-store (senha), expo-network                  |
| Nuvem         | Firebase Authentication e Realtime Database, Image Manipulator (fotos reduzidas em base64)                          |
| Recursos      | expo-image-picker, expo-image, expo-location, expo-local-authentication, expo-sharing, View Shot, react-native-maps |
| API           | Python, Flask, SQLAlchemy, MySQL, JWT, bcrypt, Swagger (flasgger), Gunicorn, Docker                                 |
| Qualidade     | Jest + Testing Library, pytest, Maestro (E2E), ESLint, Prettier, Ruff, SonarQube, Husky + Commitlint, Gitleaks      |
| APIs públicas | Dog CEO (raças de cachorro) e Cat Facts (raças de gato), via `fetch`, sem chave de acesso                           |
| CI            | GitHub Actions                                                                                                      |

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
    breeds/     sugestões de raça vindas de APIs públicas (Dog CEO e Cat Facts)
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
- **`api/`**: comunicação externa daquela funcionalidade (Firebase ou APIs públicas).
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

Os fluxos em [.maestro/telas/](.maestro/telas) usam o app de verdade, como um usuário, num emulador Android ou num celular. Cada tela é uma pasta, e cada **função** da tela é um arquivo separado:

```
.maestro/telas/02-cadastro/
  preparar.yaml          chega até a tela
  1-sem-internet.yaml    uma função testada por arquivo
  2-campos-vazios.yaml
  ...
  caminho-feliz.yaml     o mínimo para seguir à próxima tela
```

| Tela                | Funções testadas                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `01-tela-inicial`   | Textos; ida ao login e volta; ida ao cadastro e volta pelo Android                                      |
| `02-cadastro`       | Sem internet; campos vazios; e-mail inválido; senha curta (recusada pelo Firebase); campos obrigatórios |
| `03-perfil-inicial` | Campos vazios; WhatsApp curto; campos obrigatórios                                                      |
| `04-feed`           | Guia de uso; lista e mapa; botão de ajuda; foto do usuário abrindo o perfil                             |
| `05-registro`       | Sem foto não registra; campos obrigatórios; sugestões de raça (API pública); voltar pelo Android        |
| `06-perfil-dados`   | Senha para liberar a edição; nome vazio, WhatsApp inválido e senhas diferentes; salvar nome e WhatsApp  |
| `07-foto-perfil`    | Opções da foto aparecem e "Cancelar" fecha                                                              |
| `08-offline`        | Com o modo avião, o app avisa e continua funcionando; o aviso some ao reconectar                        |
| `09-sair-e-entrar`  | E-mail já cadastrado; no login, campos vazios, e-mail inválido e senha errada                           |
| `10-trocar-senha`   | Troca a senha: a antiga deixa de entrar e a nova entra; depois volta para a original                    |
| `11-desbloqueio`    | Reabre o app: senha vazia e errada; "Trocar de conta"                                                   |
| `12-login-offline`  | Entra sem internet com a senha guardada; ao reconectar, o app pede para entrar de novo                  |

Ficam para teste manual: registrar um pet e trocar a foto do perfil (dependem da câmera ou da galeria), a biometria (precisa da digital de verdade) e as ações do card de um registro (reencontro, editar, excluir, compartilhar, WhatsApp, rota e marcadores do mapa).

**Como a execução avança:**

- As telas rodam em ordem. Cada função aprovada fica anotada em `.maestro/.aprovadas` e não roda de novo; uma tela com todas as funções aprovadas faz só o caminho feliz.
- Se uma função falhar, a execução para nela e mostra o erro. A próxima execução recomeça dessa função.
- A conta criada no cadastro fica guardada em `.maestro/.conta`. Com o cadastro e o perfil inicial aprovados, as execuções seguintes entram com essa conta, depois de apagar os dados do app (como numa troca de celular), em vez de criar outra.
- Os dois arquivos ficam só no seu computador.

**Para rodar:**

1. Instale o Maestro: `curl -Ls "https://get.maestro.mobile.dev" | bash`
2. Tenha um Android conectado, de uma destas formas:
   - **Emulador (sem o Android Studio):** instale as [ferramentas de linha de comando](https://developer.android.com/studio#command-line-tools-only) em `~/Android/cmdline-tools/latest` e rode:
     ```bash
     sdkmanager --sdk_root=$HOME/Android "platform-tools" "emulator" "system-images;android-34;default;x86_64"
     avdmanager create avd -n findpets -k "system-images;android-34;default;x86_64" -d pixel_4
     ~/Android/emulator/emulator -avd findpets -no-boot-anim -no-snapshot -no-audio &
     ```
     Depois instale o [Expo Go](https://expo.dev/go) do SDK 58 com `adb install`.
   - **Celular:** ative as **Opções do desenvolvedor** e a **Depuração USB**, conecte no cabo e confira com `adb devices`.
3. Com o `npx expo start` rodando:
   ```bash
   npm run test:e2e              # verifica as funções ainda não aprovadas
   npm run test:e2e -- --tudo    # esquece as aprovações, cria uma conta nova e verifica tudo
   ```
