# FindPets API

API REST do FindPets em **Python + Flask**, com banco **MySQL** no **Docker** e documentação **Swagger**. Guarda as contas, os perfis, os registros de pets e as fotos, para o usuário recuperar tudo ao trocar de celular e ver os pets de todo mundo.

## Como rodar

1. Copie `.env.example` para `.env` e preencha as senhas e a `JWT_SECRET` (gere com `python3 -c "import secrets; print(secrets.token_hex(32))"`).
2. Suba o banco e a API:
   ```bash
   docker compose up --build
   ```
3. A API fica em `http://localhost:5001` e a documentação interativa em `http://localhost:5001/apidocs`.

Para testar pelo celular, use o IP do computador na rede (ex.: `http://192.168.0.10:5001`).

## Rotas

| Método e rota             | O que faz                                                     | Login |
| ------------------------- | ------------------------------------------------------------- | ----- |
| `POST /auth/register`     | Cria a conta e devolve o token                                | não   |
| `POST /auth/login`        | Entra (em qualquer celular) e devolve o token                 | não   |
| `GET /profile`            | Perfil da conta                                               | sim   |
| `PUT /profile`            | Cria ou atualiza o perfil                                     | sim   |
| `GET /posts`              | Registros ativos de todos, do mais novo para o mais antigo    | sim   |
| `GET /posts?since=<data>` | O que mudou desde a data, inclusive exclusões (sincronização) | sim   |
| `GET /posts/<id>`         | Um registro                                                   | sim   |
| `PUT /posts/<id>`         | Cria ou atualiza um registro (só o autor altera)              | sim   |
| `DELETE /posts/<id>`      | Exclusão lógica (só o autor)                                  | sim   |
| `POST /uploads`           | Envia uma foto e devolve a URL                                | sim   |
| `GET /uploads/<nome>`     | Devolve a foto                                                | não   |
| `GET /health`             | Verifica se a API está no ar                                  | não   |

As rotas com login recebem o cabeçalho `Authorization: Bearer <token>`.

## Decisões

- **Pronta para o app offline**: o id do registro é um UUID gerado no celular e o `PUT` pode ser repetido sem criar duplicatas. Se o servidor já tiver uma versão mais nova (`updatedAt`), ela é mantida. O `GET /posts?since=` usa o `serverUpdatedAt`, que não depende do relógio do celular.
- **Nada é apagado**: excluir preenche `deleted_at`; fotos que saem de um registro também.
- **Senhas** guardadas só como hash (bcrypt); o login devolve um token JWT.
- **Segurança**: o token vai no cabeçalho `Authorization` (e não em cookie) e, contra CSRF, alterações pedidas pelo navegador a partir de outro site (cabeçalho `Origin`) são recusadas; o app de celular não manda `Origin` e passa normalmente. O CORS fica desligado, já que o app de celular não usa; para liberar um site no navegador, coloque o endereço em `CORS_ORIGINS`. O container roda sem ser root e só recebe o código da API.
- **Banco trocável**: as tabelas e consultas usam o SQLAlchemy, então o mesmo código roda no MySQL, no Postgres (Supabase) ou no SQLite, mudando só a `DATABASE_URL` (para Postgres, instale também o driver `psycopg`).

## Estrutura

```
findpets_api/
  __init__.py       monta a API (rotas, Swagger, CORS, erros)
  config.py         variáveis de ambiente
  csrf.py           recusa alterações pedidas por outros sites
  tables.py         tabelas
  database.py       conexão, transação e "insere ou atualiza"
  auth/             senhas, token, proteção das rotas, cadastro e login
  profiles/         perfil
  posts/            payload (validação), mapper (JSON), repository (SQL), service (regras), routes
  uploads/          fotos
tests/              testes (pytest, banco SQLite temporário)
```

## Desenvolvimento

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
.venv/bin/ruff check . && .venv/bin/ruff format --check .   # lint (complexidade máx. 6)
.venv/bin/pytest                                             # testes (cobertura mínima de 100%)
```
