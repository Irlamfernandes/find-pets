# FindPets

O **FindPets** é um aplicativo mobile desenvolvido para auxiliar na localização, cadastro e resgate de animais de estimação perdidos, facilitando a conexão rápida entre tutores e a comunidade.

---

## Integrantes

- **Daniel Souza e Silva - 202210702**
- **Irlam da Silva Fernandes - 202320668**

---

## 🚀 Funcionalidades Implementadas

- **RF01:** Autenticação rápida e segura por biometria nativa do dispositivo (Expo Local Authentication).
- **RF02:** Onboarding interativo para conclusão de cadastro e perfil do usuário (com validação de nome e WhatsApp).
- **RF03:** Gestão de sessão persistente e opção de "Sair da Conta" (Logout) utilizando AsyncStorage, preservando o estado de acesso do usuário.
- **RF04:** Feed principal com listagem de posts e integração com a câmera nativa (Expo Camera) para cadastro de pets perdidos/encontrados.
- **RF05:** Captura automática de geolocalização em tempo real (Expo Location) para registrar coordenadas precisas no cadastro de cada pet.
- **Cobertura de Testes:** 100% de cobertura validada via Jest.

---

## 🛠️ Tecnologias e Ferramentas

- **React Native / Expo** (Expo Camera, Expo Local Authentication, Expo Location, SafeAreaContext)
- **JavaScript**
- **AsyncStorage** (Persistência local e suporte à arquitetura Offline-First)
- **Jest & React Native Testing Library** (Testes automatizados e unitários)
- **ESLint & Prettier** (Padronização e qualidade de código)
- **GitHub Actions** (Integração Contínua - CI/CD)

---

## 🧱 Arquitetura

O código fica em `src/`, organizado por funcionalidade:

```
src/
  app/        fluxo do app: navegação (máquina de estados)
  features/
    auth/     conta, sessão, biometria, login e desbloqueio
    profile/  cadastro e edição do perfil
    posts/    registros de pets: feed, registro, reencontro e compartilhamento
    map/      mapas (Leaflet + OpenStreetMap dentro do app)
  shared/     componentes, hooks, serviços, utilitários e tema comuns
    database/ conexão SQLite, tabelas e montagem dos comandos SQL
  testing/    utilitários dos testes (armazenamento em memória)
api/          API em Python + Flask + MySQL (ver api/README.md)
```

Dentro de cada funcionalidade:

- **`domain/`**: regras puras, sem tela nem armazenamento (ex.: `post.js`, `foundForm.js`).
- **`data/`**: acesso ao banco SQLite (repositórios com o SQL) e conversão entre o registro do app e a linha da tabela (mappers).
- **`services/`**: casos de uso usados pelos hooks. Registros e perfis ficam no SQLite (via `data/`); sessão e preferências continuam no AsyncStorage (`createJsonStore` de `shared/services/storage.js`) e as senhas no SecureStore.
- **`hooks/`**: estado e lógica das telas.
- **`components/`** e **`screens/`**: só apresentação.

Os testes ficam em `__tests__/`, ao lado do código que testam.

### 🗄️ Banco de dados (SQLite)

Tabelas `profiles`, `posts` e `post_images` (1 registro : N fotos), criadas em `src/shared/database/`. Pensando na ida para a nuvem (Firebase ou Supabase):

- os ids são **UUID**, que não se repetem entre aparelhos;
- toda tabela tem `created_at`, `updated_at` e `sync_status` (`pending` até ser enviada);
- **nada é apagado de verdade**: excluir preenche `deleted_at` (exclusão lógica) e o registro some das consultas, mas fica como histórico;
- os comandos usam parâmetros `?`, evitando SQL injection;
- mudanças de estrutura viram migrações numeradas (`src/shared/database/migrations.js`), controladas pelo `PRAGMA user_version`.

### 🔄 Offline e sincronização

O app funciona sem internet e sincroniza com a [API](api/README.md) quando a conexão volta (`src/features/sync/`):

1. toda alteração é gravada primeiro no SQLite, como `pending`; o card mostra "Aguardando internet para enviar ao servidor";
2. com internet, o app **envia** os pendentes (fotos primeiro, depois o perfil e os registros) e **baixa** o que mudou no servidor, inclusive registros de outros usuários e exclusões;
3. conflitos: vale a alteração mais recente (`updatedAt`), decidida pela API;
4. sincroniza ao entrar, quando a internet volta (NetInfo) e depois de cada alteração.

O cadastro e o primeiro login num celular precisam de internet (a API confere a senha e devolve um token, guardado no SecureStore). Depois disso, o app reabre offline com a biometria ou com a senha guardada no aparelho.

Regras que o ESLint (e o CI) exigem no código do app:

- complexidade ciclomática de no máximo 6;
- funções de até 80 linhas e arquivos de até 300;
- no máximo 3 níveis de aninhamento;
- regras de hooks do React.

---

## ⚙️ Como Executar o Projeto

1. **Clone o repositório e instale as dependências:**
   ```bash
   git clone https://github.com/Irlamfernandes/find-pets.git
   cd find-pets
   npm install --legacy-peer-deps
   ```
2. **Suba a API** (ver [api/README.md](api/README.md)):
   ```bash
   cd api && cp .env.example .env   # preencha as senhas e a JWT_SECRET
   docker compose up --build
   ```
3. **Aponte o app para a API:** copie `.env.example` para `.env` e coloque o IP do computador na rede (o celular não enxerga `localhost`):
   ```bash
   EXPO_PUBLIC_API_URL=http://192.168.0.10:5001
   ```
4. **Rode o app no celular:**
   ```bash
   npx expo run:android
   ```

## atualizações

adicionamos as interações (excluir e editar) solicitadas pelo professor na última previa do projeto.
