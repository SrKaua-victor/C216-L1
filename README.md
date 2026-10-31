<div align="center">

# C216 – Laboratório 

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Disciplina](https://img.shields.io/badge/disciplina-C216-blue)
![Uso](https://img.shields.io/badge/uso-academico-lightgrey)

Repositório referente ao Laboratório da disciplina **C216**.

</div>

---

## Banco de dados

A aplicação usa **PostgreSQL**, acessado pelo **SQLAlchemy** como ORM, com a estrutura das tabelas versionada por migrations do **Alembic**.

### Organização da persistência

| Camada | Pasta | Responsabilidade |
|---|---|---|
| Modelo ORM | `app/models` | Representa a tabela no banco (colunas, tipos, constraints) |
| Schema Pydantic | `app/schemas` | Define e valida o formato dos dados que entram e saem da API |
| Repositório | `app/repositories` | Único ponto que executa consultas no banco |
| Service | `app/services` | Regras de negócio, sem conhecer SQL |
| Sessão | `app/db` | Engine, sessão e a dependência `get_db` do FastAPI |

O modelo ORM e o schema Pydantic são separados de propósito. O primeiro descreve **como o dado é guardado**, e o segundo, **como ele é exposto**. Por exemplo, o `UserPatch` tem todos os campos opcionais, o que não faria sentido na tabela, onde nome e email são obrigatórios.

### Variáveis de ambiente

A configuração do banco vem de variáveis de ambiente. Copie os exemplos e ajuste se necessário:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

| Arquivo | Usado por | Variáveis |
|---|---|---|
| `.env` | Docker Compose e Makefile | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` |
| `backend/.env` | Aplicação e Alembic, quando rodam fora do Docker | `DATABASE_URL` |

Os arquivos `.env` não são versionados.

### Executando com Docker Compose

```bash
make up
```

Sobe o PostgreSQL e o backend. Ao iniciar, o container do backend aplica as migrations pendentes antes de subir a API. A documentação interativa fica em `http://localhost:8000/docs`.

### Executando localmente

```bash
make db-up
make migrate
make run
```

Sobe apenas o banco pelo Docker, aplica as migrations e roda a API com o uvicorn na máquina.

### Migrations

| Comando | Descrição |
|---|---|
| `make migrate` | Aplica as migrations pendentes |
| `make migration M="descricao"` | Gera uma nova migration a partir das mudanças nos modelos ORM |
| `make downgrade` | Desfaz a última migration |
| `make migrate-check` | Verifica se as migrations correspondem aos modelos ORM |

## Testes

Os testes ficam em `backend/tests` e são executados com Pytest, separados em dois tipos:

| Tipo | Pasta | O que testa |
|---|---|---|
| Unitário | `tests/unit` | Services, com um repositório falso em memória, e schemas. Sem banco e sem HTTP |
| Integração | `tests/integration` | Endpoints via `TestClient`, repositório e migrations, contra um banco real |

Cada teste recebe automaticamente o marcador `unit` ou `integration` de acordo com a pasta em que está. Um teste fora dessas duas pastas interrompe a execução com erro, o que garante que nenhum teste fique sem classificação.

Por padrão, os testes de integração usam SQLite em memória, o que dispensa qualquer instalação. Para executá-los contra o PostgreSQL, informe o banco na variável `TEST_DATABASE_URL`:

```bash
TEST_DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/c216_test make test-integration
```

### Executando localmente

Pré-requisitos: Python 3.13+ e Poetry instalados.

```bash
make install
make test
```

Comandos disponíveis:

| Comando | Descrição |
|---|---|
| `make test` | Executa toda a suíte |
| `make test-unit` | Executa apenas os testes unitários |
| `make test-integration` | Executa apenas os testes de integração |
| `make test-v` | Executa em modo verboso, listando cada teste |
| `make test-k K=404` | Executa apenas os testes cujo nome casa com `404` |
| `make lint` | Verifica estilo e erros comuns com o Ruff, sem alterar arquivos |
| `make format` | Formata o código e corrige automaticamente o que for possível |

As migrations geradas com `make migration` passam automaticamente pelo Ruff ao serem criadas.

Sem o Make, direto pelo Poetry:

```bash
cd backend
poetry install
poetry run pytest -v
poetry run pytest -m unit
poetry run pytest -m integration
```

### Integração contínua

O workflow [`.github/workflows/ci-backend.yml`](.github/workflows/ci-backend.yml) é executado no GitHub Actions a cada `push` e a cada `pull_request`, com três jobs que rodam em paralelo:

- **Lint do backend** — verifica lint e formatação com o Ruff.
- **Testes do backend** — sobe um PostgreSQL 16, aplica as migrations, verifica se elas correspondem aos modelos ORM e executa os testes unitários e os de integração em passos separados. Os testes de integração rodam contra esse PostgreSQL. O passo de integração roda mesmo se o unitário falhar, para que os dois resultados fiquem visíveis.
- **Aplicação com PostgreSQL via Docker Compose** — sobe o projeto com `docker compose`, cria um usuário pela API, reinicia o backend e confirma que o dado continua no banco.

O resultado aparece na aba **Actions** do repositório e como check nos Pull Requests.

## Frontend

Aplicação em **React** criada com **Vite** e estilizada com **Tailwind CSS**. Permite cadastrar itens com nome e descrição, ver a lista dos itens cadastrados e remover itens. Nesta etapa os itens ficam no estado do componente `App`, sem comunicação com o backend.

Recursos da interface:

- layout responsivo, com formulário e lista lado a lado no desktop e empilhados no celular;
- validação com mensagem junto ao campo, que some assim que o campo é corrigido;
- contador de caracteres em cada campo, que destaca quando o limite é ultrapassado;
- aviso temporário a cada item adicionado ou removido;
- acessibilidade: erros e avisos anunciados por leitores de tela, foco levado ao campo com erro e de volta ao formulário após adicionar, e botões de remover identificados pelo nome do item.

### Organização

| Arquivo | Responsabilidade |
|---|---|
| `src/App.jsx` | Guarda o estado dos itens, conecta o formulário à lista e exibe os avisos |
| `src/components/ItemForm.jsx` | Formulário de nome e descrição, com as mensagens de erro e os contadores |
| `src/components/ItemList.jsx` | Lista dos itens, remoção e estado vazio |
| `src/validation.js` | Regras de validação, em uma função pura sem dependência de React |

Regras de validação:

- o nome é obrigatório, tem entre 3 e 50 caracteres e não pode repetir o de um item já cadastrado, sem diferenciar maiúsculas e minúsculas;
- a descrição é opcional e tem no máximo 200 caracteres;
- espaços no início e no fim são desconsiderados.

### Executando

Pré-requisito: Node.js 24.

```bash
make frontend-install
make frontend-dev
```

A aplicação fica disponível em `http://localhost:5173`.

### Testes e qualidade

| Tipo | Ferramentas | Pasta | O que testa |
|---|---|---|---|
| Unitário | Vitest + React Testing Library | `tests/unit` | Validação e componentes isolados, com eventos disparados por `fireEvent` |
| Integração | Vitest + React Testing Library + user-event | `tests/integration` | Formulário e lista funcionando juntos no `App`, simulando a interação real do usuário |
| End-to-end | Playwright | `tests/e2e` | A aplicação em um navegador real, a partir do build de produção |

| Comando | Descrição |
|---|---|
| `make frontend-install` | Instala as dependências com `npm ci` |
| `make frontend-dev` | Sobe o servidor de desenvolvimento do Vite |
| `make frontend-lint` | Verifica o código com o linter do Biome (`biome lint`) |
| `make frontend-format` | Formata o código com o Biome (`biome format --write`) |
| `make frontend-check` | Verifica lint e formatação sem alterar arquivos |
| `make frontend-test` | Executa os testes unitários e de integração com o Vitest |
| `make frontend-test-e2e` | Executa os testes end-to-end com o Playwright |
| `make frontend-build` | Gera o build de produção em `frontend/dist` |
| `make check-all` | Verifica o projeto inteiro: backend (Ruff + Pytest) e frontend (Biome, Vitest, build, E2E) |

Antes da primeira execução dos testes end-to-end, instale o navegador usado pelo Playwright:

```bash
cd frontend
npx playwright install chromium
```

### Integração contínua

O workflow [`.github/workflows/ci-frontend.yml`](.github/workflows/ci-frontend.yml) é executado a cada `push` e a cada `pull_request`, com dois jobs que rodam em paralelo:

- **Lint do frontend** — verifica lint e formatação com o Biome.
- **Testes do frontend** — executa os testes unitários e de integração, gera o build de produção e roda os testes end-to-end no Chromium. Se os testes end-to-end falharem, o relatório do Playwright fica anexado à execução.

## Autor

**Kauã Victor Garcia Siécola**

Projeto desenvolvido como atividade avaliativa da disciplina **C216**.

## Licença

Este projeto tem finalidade exclusivamente acadêmica.
